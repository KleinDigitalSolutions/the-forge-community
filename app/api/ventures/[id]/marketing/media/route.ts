import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { consumeHourlyQuota, InsufficientEnergyError, reserveEnergy, refundEnergy, settleEnergy } from '@/lib/energy';
import { prisma } from '@/lib/prisma';
import { RateLimiters } from '@/lib/rate-limit';
import { put } from '@vercel/blob';
import Replicate from 'replicate';

export const maxDuration = 60; // Standard serverless timeout is fine for Replicate

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const COSTS: Record<string, number> = {
  'text-to-image': 4,
  'text-to-video': 35,
  'image-to-video': 40,
};

type MediaMode = 'text-to-image' | 'text-to-video' | 'image-to-video';

type ModelConfig = {
  id: string;
  label: string;
  modes: MediaMode[];
  outputType: 'image' | 'video';
  supportsImageInput?: boolean;
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
  imageUrl?: string;
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
  outputType: 'image' | 'video';
  creditsRemaining?: number;
  assets?: CachedAsset[];
  error?: string;
  settledAt?: string;
  refundedAt?: string;
  createdAt: string;
};

const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'prunaai/z-image-turbo': {
    id: 'prunaai/z-image-turbo',
    label: 'Z-Image Turbo',
    modes: ['text-to-image'],
    outputType: 'image',
  },
  'black-forest-labs/flux-schnell': {
    id: 'black-forest-labs/flux-schnell',
    label: 'Flux Schnell',
    modes: ['text-to-image'],
    outputType: 'image',
  },
  'wan-video/wan-2.1-1.3b': {
    id: 'wan-video/wan-2.1-1.3b',
    label: 'Wan 2.1',
    modes: ['text-to-video'],
    outputType: 'video',
  },
  'kwaivgi/kling-v2.5-turbo-pro': {
    id: 'kwaivgi/kling-v2.5-turbo-pro',
    label: 'Kling 2.5 Turbo Pro',
    modes: ['image-to-video'],
    outputType: 'video',
    supportsImageInput: true,
  },
};

const MEDIA_MODES: MediaMode[] = ['text-to-image', 'text-to-video', 'image-to-video'];

const DEFAULT_MODEL_BY_MODE: Record<MediaMode, string> = {
  'text-to-image': 'prunaai/z-image-turbo',
  'text-to-video': 'wan-video/wan-2.1-1.3b',
  'image-to-video': 'kwaivgi/kling-v2.5-turbo-pro',
};

const JOB_TTL_MS = 1000 * 60 * 60 * 6;

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

const HOURLY_LIMITS = {
  image: parseLimit(process.env.MARKETING_MEDIA_IMAGE_HOURLY_LIMIT, 50),
  video: parseLimit(process.env.MARKETING_MEDIA_VIDEO_HOURLY_LIMIT, 10),
};

const MAX_PROMPT_CHARS = parseLimit(process.env.MARKETING_MEDIA_MAX_PROMPT_CHARS, 1200);

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
  switch (modelId) {
    case 'prunaai/z-image-turbo': {
      const input: Record<string, unknown> = {
        prompt: options.prompt,
        width: options.width,
        height: options.height,
        output_format: 'jpg',
        output_quality: 80,
      };
      if (typeof options.guidance === 'number') input.guidance_scale = options.guidance;
      if (typeof options.steps === 'number') input.num_inference_steps = Math.max(1, Math.round(options.steps));
      return input;
    }
    case 'kwaivgi/kling-v2.5-turbo-pro': {
      if (!options.imageUrl) throw new Error('Referenzbild fehlt.');
      const input: Record<string, unknown> = {
        image: options.imageUrl,
        prompt: options.prompt,
        aspect_ratio: options.aspectRatio,
      };
      if (typeof options.duration === 'number') input.duration = options.duration;
      if (typeof options.guidance === 'number') input.guidance_scale = options.guidance;
      return input;
    }
    case 'wan-video/wan-2.1-1.3b': {
      const input: Record<string, unknown> = {
        prompt: options.prompt,
        aspect_ratio: options.aspectRatio,
      };
      if (options.negativePrompt) input.negative_prompt = options.negativePrompt;
      return input;
    }
    case 'black-forest-labs/flux-schnell':
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

const getContentInfo = (contentType: string | null, fallbackType: 'image' | 'video') => {
  if (contentType?.includes('image/jpeg') || contentType?.includes('image/jpg')) {
    return { contentType: 'image/jpeg', ext: 'jpg' };
  }
  if (contentType?.includes('image/webp')) {
    return { contentType: 'image/webp', ext: 'webp' };
  }
  if (contentType?.includes('image/png')) {
    return { contentType: 'image/png', ext: 'png' };
  }
  if (contentType?.includes('video/mp4')) {
    return { contentType: 'video/mp4', ext: 'mp4' };
  }
  if (fallbackType === 'video') {
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

  if (!modeValue || !prompt || !isValidMode(modeValue)) {
    return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 });
  }

  const mode = modeValue as MediaMode;

  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json({ error: 'Prompt ist zu lang.' }, { status: 400 });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Replicate API Token fehlt' }, { status: 500 });
  }

  const modelConfig = resolveAllowedModel(mode, model || null);
  if (!modelConfig) {
    return NextResponse.json({ error: 'Modell nicht verfügbar für diesen Modus.' }, { status: 400 });
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

  const imageFile = formData.get('image');
  let imageUrl: string | undefined;

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
  } else if (mode.includes('image-to') && modelConfig.supportsImageInput) {
    return NextResponse.json({ error: 'Bitte lade ein Referenzbild hoch.' }, { status: 400 });
  }

  const isVideoMode = modelConfig.outputType === 'video';
  const hourlyLimit = isVideoMode ? HOURLY_LIMITS.video : HOURLY_LIMITS.image;

  let reservationId: string | null = null;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: cost,
      feature: 'marketing.media',
      requestId,
      metadata: { ventureId: id, mode, cost, model: modelConfig.id }
    });
    reservationId = reservation.reservationId;

    const quota = await consumeHourlyQuota({
      userId: user.id,
      feature: isVideoMode ? 'marketing.media.video' : 'marketing.media.image',
      limit: hourlyLimit
    });

    if (!quota.allowed) {
      await refundEnergy(reservationId, 'rate-limit');
      return NextResponse.json({ error: 'Stundenlimit erreicht.' }, { status: 429 });
    }

    const finalPrompt = useBrandContext ? `${prompt}${buildBrandContext(venture.brandDNA)}` : prompt;
    const dimensions = resolveDimensions(aspectRatio);

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
    });

    const prediction = await replicate.predictions.create({
      model: modelConfig.id,
      input: replicateInput,
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
    console.error('Replicate Generation Error:', error);
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

  const cachedJob = await readJobCache(predictionId);
  if (!cachedJob || cachedJob.userId !== user.id || cachedJob.ventureId !== id) {
    return NextResponse.json({ error: 'Prediction nicht gefunden.' }, { status: 404 });
  }

  const prediction = await replicate.predictions.get(predictionId);

  if (prediction.status === 'succeeded') {
    if (!cachedJob.assets) {
      const outputUrls = await extractOutputUrls(prediction.output);
      if (!outputUrls.length) {
        await updateJobCache(predictionId, { error: 'Kein Output von Replicate' });
        return NextResponse.json({ status: 'failed', error: 'Kein Output von Replicate' });
      }

      const isVideoMode = cachedJob.outputType === 'video';
      const dimensions = getAspectDimensions(cachedJob.aspectRatio, isVideoMode);

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
              prompt: cachedJob.prompt,
              model: cachedJob.model,
              width: dimensions.width,
              height: dimensions.height,
              tags: [cachedJob.mode, 'replicate']
            }
          });

          return { url: blob.url, type: isVideoMode ? 'video' : 'image' };
        })
      );

      if (cachedJob.reservationId) {
        const settlement = await settleEnergy({
          reservationId: cachedJob.reservationId,
          finalCost: cachedJob.cost,
          provider: 'replicate',
          model: cachedJob.model
        });

        if (settlement?.creditsRemaining !== undefined) {
          cachedJob.creditsRemaining = settlement.creditsRemaining;
        }
      }

      const updated = await updateJobCache(predictionId, {
        assets: resolvedAssets,
        settledAt: new Date().toISOString(),
        creditsRemaining: cachedJob.creditsRemaining,
      });

      return NextResponse.json({
        status: prediction.status,
        assets: updated?.assets ?? resolvedAssets,
        provider: 'replicate',
        creditsRemaining: updated?.creditsRemaining ?? cachedJob.creditsRemaining ?? null
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
    if (!cachedJob.refundedAt && cachedJob.reservationId) {
      await refundEnergy(cachedJob.reservationId, 'generation-failed');
      await updateJobCache(predictionId, {
        refundedAt: new Date().toISOString(),
        error: prediction.error || 'Generation failed'
      });
    }
    return NextResponse.json({
      status: prediction.status,
      error: prediction.error || cachedJob.error || 'Generation failed'
    });
  }

  return NextResponse.json({ status: prediction.status });
}
