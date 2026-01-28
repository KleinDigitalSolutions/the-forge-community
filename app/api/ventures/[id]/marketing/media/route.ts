import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { consumeHourlyQuota, InsufficientEnergyError, reserveEnergy, refundEnergy, settleEnergy } from '@/lib/energy';
import { prisma } from '@/lib/prisma';
import { RateLimiters } from '@/lib/rate-limit';
import { put } from '@vercel/blob';
import Replicate from 'replicate';
import { generateUUID } from '@/lib/utils/uuid';

export const maxDuration = 300; // Increased to 5 minutes for video generation

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const COSTS: Record<string, number> = {
  'text-to-image': 4,
  'text-to-video': 35,
  'image-to-video': 40,
  'image-to-image': 5, // Nano Banana image blending
};

type MediaMode = 'text-to-image' | 'text-to-video' | 'image-to-video' | 'image-to-image';

type Provider = 'replicate' | 'ideogram';

type ModelConfig = {
  id: string;
  label: string;
  modes: MediaMode[];
  outputType: 'image' | 'video';
  provider: Provider;
  supportsImageInput?: boolean;
  supportsRenderingSpeed?: boolean;
  supportsStylePreset?: boolean;
};

type ReplicateInputOptions = {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: string;
  width: number;
  height: number;
  seed?: number;
  steps?: number;
  guidance?: number;
  duration?: number;
  imageUrl?: string | string[]; // Support multiple images for Nano Banana
  endImageUrl?: string; // For Veo/Kling frame interpolation
};

type CachedAsset = {
  url: string;
  type: 'image' | 'video';
};

type ReplicateJobCache = {
  ventureId: string;
  userId: string;
  mode: MediaMode;
  model: string;
  prompt: string;
  aspectRatio: string;
  cost: number;
  reservationId: string | null;
  originTag?: string;
  outputType: 'image' | 'video';
  creditsRemaining?: number;
  assets?: CachedAsset[];
  error?: string;
  settledAt?: string;
  refundedAt?: string;
  processingId?: string | null;
  processingAt?: string | null;
  processingBy?: string | null;
  createdAt: string;
};

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'black-forest-labs/flux-2-pro': {
    id: 'black-forest-labs/flux-2-pro',
    label: 'Flux 2 Pro',
    modes: ['text-to-image'],
    outputType: 'image',
    provider: 'replicate',
  },
  'black-forest-labs/flux-1.1-pro': {
    id: 'black-forest-labs/flux-1.1-pro',
    label: 'Flux 1.1 Pro',
    modes: ['text-to-image'],
    outputType: 'image',
    provider: 'replicate',
  },
  'ideogram-v3': {
    id: 'ideogram-v3',
    label: 'Ideogram 3.0 Pro',
    modes: ['text-to-image'],
    outputType: 'image',
    provider: 'ideogram',
    supportsRenderingSpeed: true,
    supportsStylePreset: true,
  },
  'kwaivgi/kling-v1.5-pro': {
    id: 'kwaivgi/kling-v1.5-pro',
    label: 'Kling 1.5 Pro',
    modes: ['image-to-video'],
    outputType: 'video',
    supportsImageInput: true,
    provider: 'replicate',
  },
  'minimax/video-01': {
    id: 'minimax/video-01',
    label: 'Minimax Video',
    modes: ['text-to-video'],
    outputType: 'video',
    provider: 'replicate',
  },
  'lumaai/dream-machine': {
    id: 'lumaai/dream-machine',
    label: 'Luma Dream Machine',
    modes: ['text-to-video'],
    outputType: 'video',
    provider: 'replicate',
  },
  'google/nano-banana': {
    id: 'google/nano-banana',
    label: 'Nano Banana · Multi-Image Blending',
    modes: ['image-to-image'],
    outputType: 'image',
    provider: 'replicate',
    supportsImageInput: true, // Supports multiple images
  },
  'google/veo-3.1': {
    id: 'google/veo-3.1',
    label: 'Veo 3.1 · Enterprise Video',
    modes: ['text-to-video', 'image-to-video'],
    outputType: 'video',
    provider: 'replicate',
    supportsImageInput: true,
  },
};

const MEDIA_MODES: MediaMode[] = ['text-to-image', 'text-to-video', 'image-to-video', 'image-to-image'];

const DEFAULT_MODEL_BY_MODE: Record<MediaMode, string> = {
  'text-to-image': 'black-forest-labs/flux-2-pro',
  'text-to-video': 'minimax/video-01',
  'image-to-video': 'kwaivgi/kling-v1.5-pro',
  'image-to-image': 'google/nano-banana',
};

const JOB_TTL_MS = 1000 * 60 * 60 * 6;
const PROCESSING_LOCK_TTL_MS = 1000 * 60 * 10;

const parseOptionalNumber = (value: FormDataEntryValue | null) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseLimit = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
};

const normalizeTag = (value: string): string | undefined => {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;
  if (!/^[a-z0-9-]+$/.test(trimmed)) return undefined;
  return trimmed;
};

const HOURLY_LIMITS = {
  image: parseLimit(process.env.MARKETING_MEDIA_IMAGE_HOURLY_LIMIT, 50),
  video: parseLimit(process.env.MARKETING_MEDIA_VIDEO_HOURLY_LIMIT, 10),
};

const MAX_PROMPT_CHARS = parseLimit(process.env.MARKETING_MEDIA_MAX_PROMPT_CHARS, 1200);
const IDEOGRAM_RENDERING_SPEEDS = new Set(['TURBO', 'DEFAULT', 'QUALITY']);
const IDEOGRAM_API_URL =
  process.env.IDEOGRAM_API_URL || 'https://api.ideogram.ai/v1/ideogram-v3/generate';
const IDEOGRAM_ENABLED = process.env.IDEOGRAM_ENABLED === 'true';

const resolveDimensions = (aspectRatio: string) => {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1024, height: 576 };
    case '9:16':
      return { width: 576, height: 1024 };
    case '4:5':
      return { width: 1024, height: 1280 };
    case '3:2':
      return { width: 1152, height: 768 };
    default:
      return { width: 1024, height: 1024 };
  }
};

const normalizeIdeogramRenderingSpeed = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return IDEOGRAM_RENDERING_SPEEDS.has(normalized) ? normalized : null;
};

const getAspectDimensions = (aspectRatio: string, isVideo: boolean) => {
  if (!isVideo) return resolveDimensions(aspectRatio);
  switch (aspectRatio) {
    case '16:9':
      return { width: 1280, height: 720 };
    case '9:16':
      return { width: 720, height: 1280 };
    case '4:5':
      return { width: 720, height: 900 };
    case '3:2':
      return { width: 1280, height: 853 };
    default:
      return { width: 1024, height: 1024 };
  }
};

const buildBrandContext = (brandDNA: any) => {
  if (!brandDNA) return '';

  const parts = [
    `Brand: ${brandDNA.brandName}`,
    brandDNA.productCategory ? `Category: ${brandDNA.productCategory}` : null,
    brandDNA.primaryColor ? `Primary color: ${brandDNA.primaryColor}` : null,
    brandDNA.toneOfVoice ? `Tone: ${brandDNA.toneOfVoice}` : null,
  ].filter(Boolean);

  if (!parts.length) return '';
  return `\n\nBrand context: ${parts.join(' | ')}`;
};

const buildReplicateInput = (modelId: string, options: ReplicateInputOptions) => {
  // Video models safety: ensure supported aspect ratios
  const isVideoModel = ['kwaivgi/kling-v1.5-pro', 'minimax/video-01', 'lumaai/dream-machine'].includes(modelId);
  const safeAspectRatio = isVideoModel && !['16:9', '9:16'].includes(options.aspectRatio) 
    ? '16:9' 
    : options.aspectRatio;

  switch (modelId) {
    case 'black-forest-labs/flux-1.1-pro':
    case 'black-forest-labs/flux-2-pro': {
      const input: Record<string, unknown> = {
        prompt: options.prompt,
        aspect_ratio: options.aspectRatio,
        output_format: 'jpg',
        output_quality: 100,
      };
      return input;
    }
    case 'kwaivgi/kling-v1.5-pro': {
      if (!options.imageUrl) throw new Error('Referenzbild fehlt.');
      const input: Record<string, unknown> = {
        image: options.imageUrl,
        prompt: options.prompt,
        aspect_ratio: safeAspectRatio,
      };
      if (typeof options.duration === 'number') input.duration = options.duration;
      if (typeof options.guidance === 'number') input.guidance_scale = options.guidance;
      return input;
    }
    case 'minimax/video-01':
    case 'lumaai/dream-machine': {
      const input: Record<string, unknown> = {
        prompt: options.prompt,
        aspect_ratio: safeAspectRatio,
      };
      return input;
    }
    case 'google/veo-3.1': {
      const input: Record<string, unknown> = {
        prompt: options.prompt,
        aspect_ratio: safeAspectRatio,
      };
      if (options.imageUrl) input.image = options.imageUrl;
      if (options.endImageUrl) input.end_image = options.endImageUrl;
      return input;
    }
    case 'google/nano-banana': {
      // Nano Banana: Multi-Image Blending
      const input: Record<string, unknown> = {
        prompt: options.prompt,
        aspect_ratio: options.aspectRatio,
        output_format: 'jpg',
      };
      // Support multiple image inputs (passed as array or single imageUrl)
      if (options.imageUrl) {
        // If single URL, wrap in array; if already array, use as-is
        input.image_input = Array.isArray(options.imageUrl)
          ? options.imageUrl
          : [options.imageUrl];
      }
      return input;
    }
    default: {
      const input: Record<string, unknown> = {
        prompt: options.prompt,
        aspect_ratio: options.aspectRatio,
        output_format: 'png',
        output_quality: 90,
      };
      if (options.negativePrompt) input.negative_prompt = options.negativePrompt;
      return input;
    }
  }
};

const normalizeOutputUrl = async (item: unknown) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
  if (typeof item === 'object') {
    const record = item as { url?: string | (() => Promise<string> | string) };
    if (typeof record.url === 'string') return record.url;
    if (typeof record.url === 'function') return await record.url();
  }
  return null;
};

const extractOutputUrls = async (output: unknown) => {
  if (!output) return [];
  if (Array.isArray(output)) {
    const urls = await Promise.all(output.map((item) => normalizeOutputUrl(item)));
    return urls.filter(Boolean) as string[];
  }
  const single = await normalizeOutputUrl(output);
  return single ? [single] : [];
};

const normalizePredictionError = (value: unknown) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  try {
    const serialized = JSON.stringify(value);
    return serialized === '{}' ? null : serialized;
  } catch {
    return null;
  }
};

const getContentInfo = (contentType: string | null, fallbackType: 'image' | 'video') => {
  const ct = contentType?.toLowerCase() || '';
  if (ct.includes('image/jpeg') || ct.includes('image/jpg')) {
    return { contentType: 'image/jpeg', ext: 'jpg' };
  }
  if (ct.includes('image/webp')) {
    return { contentType: 'image/webp', ext: 'webp' };
  }
  if (ct.includes('image/png')) {
    return { contentType: 'image/png', ext: 'png' };
  }
  if (ct.includes('video/mp4') || ct.includes('video/quicktime') || fallbackType === 'video') {
    return { contentType: 'video/mp4', ext: 'mp4' };
  }
  return { contentType: 'image/png', ext: 'png' };
};

const isFileLike = (value: FormDataEntryValue | null): value is File => {
  return Boolean(value && typeof value === 'object' && 'arrayBuffer' in value && 'type' in value);
};

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, '-');

const jobKeyForPrediction = (predictionId: string) => `replicate:media:${predictionId}`;

const readJobCache = async (predictionId: string) => {
  const record = await prisma.systemCache.findUnique({ where: { key: jobKeyForPrediction(predictionId) } });
  if (!record) return null;
  try {
    return JSON.parse(record.value) as ReplicateJobCache;
  } catch (error) {
    console.error('Failed to parse job cache', error);
    return null;
  }
};

const writeJobCache = async (predictionId: string, payload: ReplicateJobCache) => {
  const expiresAt = new Date(Date.now() + JOB_TTL_MS);
  await prisma.systemCache.upsert({
    where: { key: jobKeyForPrediction(predictionId) },
    update: { value: JSON.stringify(payload), expiresAt },
    create: { key: jobKeyForPrediction(predictionId), value: JSON.stringify(payload), expiresAt },
  });
};

const updateJobCache = async (predictionId: string, updates: Partial<ReplicateJobCache>) => {
  const existing = await readJobCache(predictionId);
  if (!existing) return null;
  const next = { ...existing, ...updates } as ReplicateJobCache;
  await writeJobCache(predictionId, next);
  return next;
};

const isFreshLock = (lockId?: string | null, lockAt?: string | null) => {
  if (!lockId || !lockAt) return false;
  const lockTime = Date.parse(lockAt);
  if (Number.isNaN(lockTime)) return false;
  return Date.now() - lockTime < PROCESSING_LOCK_TTL_MS;
};

const acquireProcessingLock = async (predictionId: string, holder: string) => {
  const current = await readJobCache(predictionId);
  if (!current) return null;
  if (isFreshLock(current.processingId, current.processingAt)) return null;

  const lockId = generateUUID();
  await updateJobCache(predictionId, {
    processingId: lockId,
    processingAt: new Date().toISOString(),
    processingBy: holder,
  });

  const confirmed = await readJobCache(predictionId);
  if (!confirmed || confirmed.processingId !== lockId) return null;
  return confirmed;
};

const resolveAllowedModel = (mode: MediaMode, requestedModel: string | null) => {
  const fallback = DEFAULT_MODEL_BY_MODE[mode];
  if (!requestedModel) return MODEL_CONFIGS[fallback];
  const modelConfig = MODEL_CONFIGS[requestedModel];
  if (!modelConfig) return null;
  if (!modelConfig.modes.includes(mode)) return null;
  return modelConfig;
};

const isValidMode = (value: string): value is MediaMode => MEDIA_MODES.includes(value as MediaMode);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await RateLimiters.media(request);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  const formData = await request.formData();

  const modeValue = String(formData.get('mode') || '');
  const prompt = String(formData.get('prompt') || '').trim();
  const model = String(formData.get('model') || '').trim();
  const aspectRatio = String(formData.get('aspectRatio') || '1:1');
  const useBrandContext = formData.get('useBrandContext') === 'true';
  const negativePrompt = String(formData.get('negativePrompt') || '').trim();
  const renderingSpeed = String(formData.get('renderingSpeed') || '').trim();
  const stylePreset = String(formData.get('stylePreset') || '').trim();
  const originTag = normalizeTag(String(formData.get('originTag') || ''));
  const extraTags = originTag ? [originTag] : [];

  if (!modeValue || !prompt || !isValidMode(modeValue)) {
    return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 });
  }

  const mode = modeValue as MediaMode;

  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json({ error: 'Prompt ist zu lang.' }, { status: 400 });
  }

  const modelConfig = resolveAllowedModel(mode, model || null);
  if (!modelConfig) {
    return NextResponse.json({ error: 'Modell nicht verfügbar für diesen Modus.' }, { status: 400 });
  }

  if (modelConfig.provider === 'replicate' && !process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Replicate API Token fehlt' }, { status: 500 });
  }

  if (modelConfig.provider === 'ideogram') {
    if (!IDEOGRAM_ENABLED) {
      return NextResponse.json({ error: 'Ideogram ist aktuell deaktiviert.' }, { status: 403 });
    }
    if (!process.env.IDEOGRAM_API_KEY) {
      return NextResponse.json({ error: 'Ideogram API Key fehlt' }, { status: 500 });
    }
  }

  const cost = Number.isFinite(COSTS[mode]) ? COSTS[mode] : 20;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
  }

  const venture = await prisma.venture.findFirst({
    where: { id, ownerId: user.id },
    include: { brandDNA: true }
  });

  if (!venture) {
    return NextResponse.json({ error: 'Venture nicht gefunden oder Zugriff verweigert' }, { status: 404 });
  }

  const steps = parseOptionalNumber(formData.get('steps'));
  const guidance = parseOptionalNumber(formData.get('guidance'));
  const seed = parseOptionalNumber(formData.get('seed'));
  const duration = parseOptionalNumber(formData.get('duration'));

  // Multi-Image Upload Support (for Nano Banana image-to-image)
  const imageFile = formData.get('image');
  const endImageFile = formData.get('endImage');
  const existingImageUrl = formData.get('existingImageUrl');
  const existingEndImageUrl = formData.get('existingEndImageUrl');
  const imageFiles = formData.getAll('images'); // For multiple images
  let imageUrl: string | string[] | undefined;
  let endImageUrl: string | undefined;

  if (mode === 'image-to-image') {
    // ... (rest of logic same)
    if (imageFiles.length < 2 || imageFiles.length > 3) {
      return NextResponse.json({ error: 'Bitte lade 2-3 Referenzbilder hoch.' }, { status: 400 });
    }
    if (!imageFiles.every(isFileLike)) {
      return NextResponse.json({ error: 'Ungültige Bilddaten.' }, { status: 415 });
    }

    const uploadedUrls: string[] = [];
    for (const file of imageFiles as File[]) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: `Bild "${file.name}" ist zu groß.` }, { status: 413 });
      }
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json({ error: `Ungültiger Typ für "${file.name}".` }, { status: 415 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = sanitizeFilename(file.name || 'reference');
      const filename = `marketing/${user.id}/inputs/${Date.now()}-${safeName}`;
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: file.type,
      });
      uploadedUrls.push(blob.url);
    }

    imageUrl = uploadedUrls; // Pass as array for Nano Banana
  } else {
    if (isFileLike(imageFile)) {
      if (imageFile.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'Bild ist zu groß.' }, { status: 413 });
      }
      if (!ALLOWED_MIME_TYPES.has(imageFile.type)) {
        return NextResponse.json({ error: 'Ungültiger Bildtyp.' }, { status: 415 });
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const safeName = sanitizeFilename(imageFile.name || 'reference');
      const filename = `marketing/${user.id}/inputs/${Date.now()}-${safeName}`;
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: imageFile.type,
      });
      imageUrl = blob.url;
    }

    if (isFileLike(endImageFile)) {
      if (endImageFile.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'End-Bild ist zu groß.' }, { status: 413 });
      }
      if (!ALLOWED_MIME_TYPES.has(endImageFile.type)) {
        return NextResponse.json({ error: 'Ungültiger End-Bildtyp.' }, { status: 415 });
      }

      const buffer = Buffer.from(await endImageFile.arrayBuffer());
      const safeName = sanitizeFilename(endImageFile.name || 'end-frame');
      const filename = `marketing/${user.id}/inputs/${Date.now()}-end-${safeName}`;
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: endImageFile.type,
      });
      endImageUrl = blob.url;
    } else if (typeof existingEndImageUrl === 'string') {
      endImageUrl = existingEndImageUrl;
    }

    if (!imageUrl && typeof existingImageUrl === 'string') {
      imageUrl = existingImageUrl;
    }

    if (!imageUrl && mode.includes('image-to') && modelConfig.supportsImageInput) {
      return NextResponse.json({ error: 'Bitte lade ein Referenzbild hoch.' }, { status: 400 });
    }
  }

  const isVideoMode = modelConfig.outputType === 'video';
  const hourlyLimit = isVideoMode ? HOURLY_LIMITS.video : HOURLY_LIMITS.image;

  let reservationId: string | null = null;
  const requestId = request.headers.get('x-request-id') || generateUUID();

  try {
    // Step 1: Reserve credits (fail fast if insufficient)
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: cost,
      feature: 'marketing.media',
      requestId,
      metadata: { ventureId: id, mode, cost, model: modelConfig.id }
    });
    reservationId = reservation.reservationId;

    // Step 2: Check hourly quota (existing protection)
    const hourlyQuota = await consumeHourlyQuota({
      userId: user.id,
      feature: isVideoMode ? 'marketing.media.video' : 'marketing.media.image',
      limit: hourlyLimit
    });

    if (!hourlyQuota.allowed) {
      await refundEnergy(reservationId, 'hourly-rate-limit');
      return NextResponse.json({
        error: 'Stundenlimit erreicht.',
        retryAfter: Math.ceil((hourlyQuota.resetAt.getTime() - Date.now()) / 1000)
      }, { status: 429 });
    }

    // Step 3: Check daily quota (NEW: prevent abuse, especially for expensive video generation)
    const { checkDailyImageQuota, checkDailyVideoQuota } = await import('@/lib/energy');
    const dailyQuota = isVideoMode
      ? await checkDailyVideoQuota(user.id)
      : await checkDailyImageQuota(user.id);

    if (!dailyQuota.allowed) {
      await refundEnergy(reservationId, 'daily-quota-exceeded');
      const mediaType = isVideoMode ? 'Video' : 'Bild';
      return NextResponse.json({
        error: `Tageslimit für ${mediaType}-Generierung erreicht (${dailyQuota.limit}/Tag). Nächster Reset: ${dailyQuota.resetAt.toLocaleTimeString('de-DE')}`,
        quota: {
          type: isVideoMode ? 'video' : 'image',
          limit: dailyQuota.limit,
          remaining: dailyQuota.remaining,
          resetAt: dailyQuota.resetAt.toISOString()
        }
      }, { status: 429 });
    }

    const finalPrompt = useBrandContext ? `${prompt}${buildBrandContext(venture.brandDNA)}` : prompt;
    const dimensions = resolveDimensions(aspectRatio);

    if (modelConfig.provider === 'ideogram') {
      const payload: Record<string, unknown> = {
        prompt: finalPrompt,
      };

      const normalizedSpeed = normalizeIdeogramRenderingSpeed(renderingSpeed || 'TURBO');
      if (modelConfig.supportsRenderingSpeed && normalizedSpeed) {
        payload.rendering_speed = normalizedSpeed;
      }
      if (modelConfig.supportsStylePreset && stylePreset) {
        payload.style_preset = stylePreset;
      }

      const ideogramRes = await fetch(IDEOGRAM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': process.env.IDEOGRAM_API_KEY || '',
        },
        body: JSON.stringify(payload),
      });

      const ideogramData = await ideogramRes.json().catch(() => ({}));
      if (!ideogramRes.ok) {
        const errorMessage =
          ideogramData?.error || ideogramData?.message || 'Ideogram request failed';
        throw new Error(errorMessage);
      }

      const outputUrls = Array.isArray(ideogramData?.data)
        ? ideogramData.data.map((item: any) => item?.url).filter(Boolean)
        : [];

      if (!outputUrls.length) {
        throw new Error('Kein Output von Ideogram');
      }

      const resolvedAssets = await Promise.all(
        outputUrls.map(async (url: string, index: number) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error('Output konnte nicht geladen werden');
          const blobData = await res.blob();
          const buffer = Buffer.from(await blobData.arrayBuffer());
          const info = getContentInfo(res.headers.get('content-type'), 'image');

          const filename = `marketing/${user.id}/${Date.now()}-${index}.${info.ext}`;
          const blob = await put(filename, buffer, {
            access: 'public',
            contentType: info.contentType,
          });

          await prisma.mediaAsset.create({
            data: {
              ventureId: id,
              ownerId: user.id,
              type: 'IMAGE',
              url: blob.url,
              filename,
              mimeType: info.contentType,
              size: buffer.length,
              source: 'GENERATED',
              prompt,
              model: modelConfig.id,
              width: dimensions.width,
              height: dimensions.height,
              tags: [mode, 'ideogram', ...extraTags]
            }
          });

          return { url: blob.url, type: 'image' as const };
        })
      );

      const settlement = reservationId
        ? await settleEnergy({
            reservationId,
            finalCost: cost,
            provider: 'ideogram',
            model: modelConfig.id
          })
        : null;

      return NextResponse.json({
        status: 'succeeded',
        assets: resolvedAssets,
        provider: 'ideogram',
        creditsUsed: cost,
        creditsRemaining: settlement?.creditsRemaining ?? null
      });
    }

    const replicateInput = buildReplicateInput(modelConfig.id, {
      prompt: finalPrompt,
      negativePrompt: negativePrompt || undefined,
      aspectRatio,
      width: dimensions.width,
      height: dimensions.height,
      seed,
      steps,
      guidance,
      duration,
      imageUrl,
      endImageUrl,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    const webhookUrl = appUrl ? `${appUrl}/api/webhooks/replicate` : undefined;

    const prediction = await replicate.predictions.create({
      model: modelConfig.id,
      input: replicateInput,
      ...(webhookUrl ? {
        webhook: webhookUrl,
        webhook_events_filter: ['completed'],
      } : {}),
    });

    await writeJobCache(prediction.id, {
      ventureId: id,
      userId: user.id,
      mode,
      model: modelConfig.id,
      prompt,
      aspectRatio,
      cost,
      reservationId,
      originTag,
      outputType: modelConfig.outputType,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      predictionId: prediction.id,
      status: prediction.status,
      provider: 'replicate',
      creditsUsed: cost,
    });
  } catch (error: any) {
    if (reservationId) await refundEnergy(reservationId, 'generation-failed');
    if (error instanceof InsufficientEnergyError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    console.error('Media Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
  const predictionId = request.nextUrl.searchParams.get('predictionId');

  if (!predictionId) {
    return NextResponse.json({ error: 'predictionId fehlt.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
  }

  let cachedJob = await readJobCache(predictionId);
  if (!cachedJob || cachedJob.userId !== user.id || cachedJob.ventureId !== id) {
    return NextResponse.json({ error: 'Prediction nicht gefunden.' }, { status: 404 });
  }

  const prediction = await replicate.predictions.get(predictionId);

  if (prediction.status === 'succeeded') {
    if (!cachedJob.assets) {
      const lockedJob = await acquireProcessingLock(predictionId, 'poll');
      if (!lockedJob) {
        return NextResponse.json({
          status: 'processing',
          assets: cachedJob.assets ?? null,
          provider: 'replicate',
          creditsRemaining: cachedJob.creditsRemaining ?? null
        });
      }
      const job = lockedJob;
      if (job.assets) {
        return NextResponse.json({
          status: prediction.status,
          assets: job.assets,
          provider: 'replicate',
          creditsRemaining: job.creditsRemaining ?? null
        });
      }

      const outputUrls = await extractOutputUrls(prediction.output);
      if (!outputUrls.length) {
        await updateJobCache(predictionId, {
          error: 'Kein Output von Replicate',
          processingId: null,
          processingAt: null,
          processingBy: null,
        });
        return NextResponse.json({ status: 'failed', error: 'Kein Output von Replicate' });
      }

      const isVideoMode = job.outputType === 'video';
      const dimensions = getAspectDimensions(job.aspectRatio, isVideoMode);

      const resolvedAssets = await Promise.all(
        outputUrls.map(async (url, index) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error('Output konnte nicht geladen werden');
          const blobData = await res.blob();
          const buffer = Buffer.from(await blobData.arrayBuffer());
          const info = getContentInfo(res.headers.get('content-type'), isVideoMode ? 'video' : 'image');

          const filename = `marketing/${user.id}/${Date.now()}-${index}.${info.ext}`;
          const blob = await put(filename, buffer, {
            access: 'public',
            contentType: info.contentType,
          });

          await prisma.mediaAsset.create({
            data: {
              ventureId: id,
              ownerId: user.id,
              type: isVideoMode ? 'VIDEO' : 'IMAGE',
              url: blob.url,
              filename,
              mimeType: info.contentType,
              size: buffer.length,
              source: 'GENERATED',
              prompt: job.prompt,
              model: job.model,
              width: dimensions.width,
              height: dimensions.height,
              tags: [job.mode, 'replicate', ...(job.originTag ? [job.originTag] : [])]
            }
          });

          return { url: blob.url, type: (isVideoMode ? 'video' : 'image') as 'image' | 'video' };
        })
      );

      if (job.reservationId) {
        const settlement = await settleEnergy({
          reservationId: job.reservationId,
          finalCost: job.cost,
          provider: 'replicate',
          model: job.model
        });

        if (settlement?.creditsRemaining !== undefined) {
          job.creditsRemaining = settlement.creditsRemaining;
        }
      }

      const updated = await updateJobCache(predictionId, {
        assets: resolvedAssets,
        settledAt: new Date().toISOString(),
        creditsRemaining: job.creditsRemaining,
        processingId: null,
        processingAt: null,
        processingBy: null,
      });

      return NextResponse.json({
        status: prediction.status,
        assets: updated?.assets ?? resolvedAssets,
        provider: 'replicate',
        creditsRemaining: updated?.creditsRemaining ?? job.creditsRemaining ?? null
      });
    }

    return NextResponse.json({
      status: prediction.status,
      assets: cachedJob.assets,
      provider: 'replicate',
      creditsRemaining: cachedJob.creditsRemaining ?? null
    });
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    const normalizedError = normalizePredictionError(prediction.error);
    if (!cachedJob.refundedAt && cachedJob.reservationId) {
      await refundEnergy(cachedJob.reservationId, 'generation-failed');
      await updateJobCache(predictionId, {
        refundedAt: new Date().toISOString(),
        error: normalizedError || 'Generation failed',
        processingId: null,
        processingAt: null,
        processingBy: null,
      });
    }
    return NextResponse.json({
      status: prediction.status,
      error: normalizedError || cachedJob.error || 'Generation failed'
    });
  }

  return NextResponse.json({ status: prediction.status });
}
