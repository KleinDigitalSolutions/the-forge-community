import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { reserveEnergy, refundEnergy, settleEnergy, InsufficientEnergyError, checkDailyVideoQuota, checkMonthlyAvatarQuota, getUserTier } from '@/lib/energy';
import { prisma } from '@/lib/prisma';
import { RateLimiters } from '@/lib/rate-limit';
import { put } from '@vercel/blob';
import Replicate from 'replicate';
import { generateUUID } from '@/lib/utils/uuid';
import { FACESWAP_MODELS } from '@/lib/media-models';

export const maxDuration = 300; // 5 minutes for face swap processing

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const MODAL_IMAGE_TO_VIDEO_URL =
  process.env.MODAL_MEDIA_IMAGE_TO_VIDEO_URL || process.env.MODAL_MEDIA_TEXT_TO_VIDEO_URL;

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime']);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_ASPECT_RATIOS = new Set(['1:1', '4:5', '9:16', '16:9', '3:2']);

const parseLimit = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
};

const FREE_AVATAR_COST = parseLimit(process.env.MARKETING_AVATAR_FREE_CREDITS, 10);
const FREE_AVATAR_MODEL = process.env.MARKETING_AVATAR_FREE_MODEL || 'wan-2.2';
const FREE_AVATAR_DEFAULT_PROMPT =
  process.env.MARKETING_AVATAR_FREE_PROMPT || 'high quality, cinematic lighting, smooth motion';
const FREE_AVATAR_DEFAULT_ASPECT = process.env.MARKETING_AVATAR_FREE_ASPECT_RATIO || '9:16';
const FREE_AVATAR_DEFAULT_DURATION = parseLimit(process.env.MARKETING_AVATAR_FREE_DURATION, 4);

type FaceSwapJobCache = {
  ventureId: string;
  userId: string;
  model: string;
  cost: number;
  reservationId: string | null;
  videoUrl?: string;
  faceUrl?: string;
  outputUrl?: string;
  error?: string;
  settledAt?: string;
  refundedAt?: string;
  createdAt: string;
};

const jobKeyForPrediction = (predictionId: string) => `faceswap:${predictionId}`;

const readJobCache = async (predictionId: string) => {
  const record = await prisma.systemCache.findUnique({ where: { key: jobKeyForPrediction(predictionId) } });
  if (!record) return null;
  try {
    return JSON.parse(record.value) as FaceSwapJobCache;
  } catch {
    return null;
  }
};

const writeJobCache = async (predictionId: string, payload: FaceSwapJobCache) => {
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 6); // 6 hours
  await prisma.systemCache.upsert({
    where: { key: jobKeyForPrediction(predictionId) },
    update: { value: JSON.stringify(payload), expiresAt },
    create: { key: jobKeyForPrediction(predictionId), value: JSON.stringify(payload), expiresAt },
  });
};

const updateJobCache = async (predictionId: string, updates: Partial<FaceSwapJobCache>) => {
  const existing = await readJobCache(predictionId);
  if (!existing) return null;
  const next = { ...existing, ...updates };
  await writeJobCache(predictionId, next);
  return next;
};

const isFileLike = (value: FormDataEntryValue | null): value is File => {
  return Boolean(value && typeof value === 'object' && 'arrayBuffer' in value && 'type' in value);
};

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, '-');

const parseFormNumber = (value: FormDataEntryValue | null, fallback: number) => {
  if (typeof value !== 'string') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeAspectRatio = (value: string | undefined) => {
  if (!value) return FREE_AVATAR_DEFAULT_ASPECT;
  const trimmed = value.trim();
  return ALLOWED_ASPECT_RATIOS.has(trimmed) ? trimmed : FREE_AVATAR_DEFAULT_ASPECT;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await RateLimiters.heavy(request);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id: ventureId } = await params;
  const formData = await request.formData();

  const modelKey = String(formData.get('model') || 'lucataco-faceswap');
  const videoFile = formData.get('video');
  const faceFile = formData.get('face');
  const swapCondition = String(formData.get('swapCondition') || 'all'); // 'all' or 'first'
  const prompt = String(formData.get('prompt') || '').trim();
  const aspectRatio = normalizeAspectRatio(
    typeof formData.get('aspectRatio') === 'string' ? String(formData.get('aspectRatio')) : undefined
  );
  const duration = parseFormNumber(formData.get('duration'), FREE_AVATAR_DEFAULT_DURATION);
  const fps = parseFormNumber(formData.get('fps'), 24);
  const guidance = parseFormNumber(formData.get('guidance'), 7.5);
  const steps = parseFormNumber(formData.get('steps'), 30);

  const hasVideo = isFileLike(videoFile);
  const hasFace = isFileLike(faceFile);

  if (!hasFace) {
    return NextResponse.json({ error: 'Referenzbild ist erforderlich' }, { status: 400 });
  }

  const face = faceFile as File;
  const video = hasVideo ? (videoFile as File) : null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
  }

  const venture = await prisma.venture.findFirst({
    where: { id: ventureId, ownerId: user.id },
  });

  if (!venture) {
    return NextResponse.json({ error: 'Venture nicht gefunden oder Zugriff verweigert' }, { status: 404 });
  }

  const tier = await getUserTier(user.id);
  const isPaid = tier === 'paid';

  if (isPaid && !hasVideo) {
    return NextResponse.json({ error: 'Video ist für Pro erforderlich' }, { status: 400 });
  }

  const modelConfig = isPaid ? FACESWAP_MODELS[modelKey] : null;
  if (isPaid && !modelConfig) {
    return NextResponse.json({ error: 'Ungültiges Modell' }, { status: 400 });
  }

  if (isPaid && !process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Replicate API Token fehlt' }, { status: 500 });
  }

  if (!isPaid && !MODAL_IMAGE_TO_VIDEO_URL) {
    return NextResponse.json({ error: 'Modal Video Endpoint nicht konfiguriert' }, { status: 500 });
  }

  // Validate files
  if (hasVideo && video!.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: 'Video ist zu groß (max 50MB)' }, { status: 413 });
  }
  if (face.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Referenzbild ist zu groß (max 10MB)' }, { status: 413 });
  }
  if (hasVideo && !ALLOWED_VIDEO_TYPES.has(video!.type)) {
    return NextResponse.json({ error: 'Ungültiges Video-Format (nur MP4/MOV)' }, { status: 415 });
  }
  if (!ALLOWED_IMAGE_TYPES.has(face.type)) {
    return NextResponse.json({ error: 'Ungültiges Bild-Format (nur JPG/PNG/WebP)' }, { status: 415 });
  }

  const cost = isPaid ? modelConfig!.cost : FREE_AVATAR_COST;
  let reservationId: string | null = null;
  const requestId = request.headers.get('x-request-id') || generateUUID();

  try {
    // Step 1: Reserve credits
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: cost,
      feature: 'marketing.faceswap',
      requestId,
      metadata: {
        ventureId,
        model: isPaid ? modelConfig!.id : FREE_AVATAR_MODEL,
        cost,
        tier
      }
    });
    reservationId = reservation.reservationId;

    // Step 2: Monthly + Daily quotas
    const monthlyQuota = await checkMonthlyAvatarQuota(user.id);
    if (!monthlyQuota.allowed) {
      await refundEnergy(reservationId, 'monthly-quota-exceeded');
      return NextResponse.json({
        error: `Monatslimit erreicht (${monthlyQuota.limit}/Monat). Reset: ${monthlyQuota.resetAt.toLocaleDateString('de-DE')}`,
        quota: {
          limit: monthlyQuota.limit,
          remaining: monthlyQuota.remaining,
          resetAt: monthlyQuota.resetAt.toISOString()
        }
      }, { status: 429 });
    }

    const dailyQuota = await checkDailyVideoQuota(user.id);
    if (!dailyQuota.allowed) {
      await refundEnergy(reservationId, 'daily-quota-exceeded');
      return NextResponse.json({
        error: `Tageslimit für Avatar Swap erreicht (${dailyQuota.limit}/Tag). Reset: ${dailyQuota.resetAt.toLocaleTimeString('de-DE')}`,
        quota: {
          limit: dailyQuota.limit,
          remaining: dailyQuota.remaining,
          resetAt: dailyQuota.resetAt.toISOString()
        }
      }, { status: 429 });
    }

    // Step 3: Upload files to Vercel Blob
    const faceBuffer = Buffer.from(await face.arrayBuffer());
    const faceFilename = `faceswap/${user.id}/faces/${Date.now()}-${sanitizeFilename(face.name)}`;
    const faceBlob = await put(faceFilename, faceBuffer, {
      access: 'public',
      contentType: face.type,
    });

    const videoBlob = hasVideo
      ? await (async () => {
          const videoBuffer = Buffer.from(await video!.arrayBuffer());
          const videoFilename = `faceswap/${user.id}/videos/${Date.now()}-${sanitizeFilename(video!.name)}`;
          return put(videoFilename, videoBuffer, {
            access: 'public',
            contentType: video!.type,
          });
        })()
      : null;

    if (isPaid) {
      const input: Record<string, unknown> = {
        target_video: videoBlob!.url,
        swap_image: faceBlob.url,
      };

      if (modelKey === 'lucataco-faceswap') {
        input.swap_condition = swapCondition;
      }

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
      const webhookUrl = appUrl ? `${appUrl}/api/webhooks/replicate` : undefined;

      const prediction = await replicate.predictions.create({
        model: modelConfig!.id,
        input,
        ...(webhookUrl
          ? {
              webhook: webhookUrl,
              webhook_events_filter: ['completed'],
            }
          : {}),
      });

      await writeJobCache(prediction.id, {
        ventureId,
        userId: user.id,
        model: modelConfig!.id,
        cost,
        reservationId,
        videoUrl: videoBlob!.url,
        faceUrl: faceBlob.url,
        createdAt: new Date().toISOString(),
      });

      return NextResponse.json({
        predictionId: prediction.id,
        status: prediction.status,
        provider: 'replicate',
        model: modelConfig!.label,
        creditsUsed: cost,
        tier
      });
    }

    const resolvedDuration = Math.min(12, Math.max(2, Math.round(duration)));
    const resolvedPrompt = prompt || FREE_AVATAR_DEFAULT_PROMPT;
    const modalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (process.env.MODAL_API_KEY) {
      modalHeaders.Authorization = `Bearer ${process.env.MODAL_API_KEY}`;
    }

    const modalPayload = {
      mode: 'image-to-video',
      model: FREE_AVATAR_MODEL,
      prompt: resolvedPrompt,
      negativePrompt: undefined,
      imageUrl: faceBlob.url,
      aspectRatio,
      duration: resolvedDuration,
      fps: Math.round(fps),
      guidance,
      steps,
    };

    const modalRes = await fetch(MODAL_IMAGE_TO_VIDEO_URL!, {
      method: 'POST',
      headers: modalHeaders,
      body: JSON.stringify(modalPayload),
    });

    if (!modalRes.ok) {
      const errText = await modalRes.text();
      throw new Error(`Modal error: ${errText}`);
    }

    const modalData = await modalRes.json();
    const resultAsset = Array.isArray(modalData?.assets) ? modalData.assets[0] : modalData?.asset;

    if (!resultAsset?.data) {
      throw new Error('Kein Output von Modal');
    }

    const outputBuffer = Buffer.from(resultAsset.data, 'base64');
    const outputFilename = `avatar/${user.id}/outputs/${Date.now()}-result.mp4`;
    const outputBlob = await put(outputFilename, outputBuffer, {
      access: 'public',
      contentType: 'video/mp4',
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        ventureId,
        ownerId: user.id,
        type: 'VIDEO',
        url: outputBlob.url,
        filename: outputFilename,
        mimeType: 'video/mp4',
        size: outputBuffer.length,
        source: 'GENERATED',
        prompt: resolvedPrompt,
        model: FREE_AVATAR_MODEL,
        tags: ['avatar', 'modal', FREE_AVATAR_MODEL]
      }
    });

    if (reservationId) {
      await settleEnergy({
        reservationId,
        finalCost: cost,
        provider: 'modal',
        model: FREE_AVATAR_MODEL,
        metadata: { assetId: asset.id },
      });
    }

    return NextResponse.json({
      status: 'succeeded',
      outputUrl: outputBlob.url,
      provider: 'modal',
      model: FREE_AVATAR_MODEL,
      creditsUsed: cost,
      tier
    });
  } catch (error: any) {
    if (reservationId) await refundEnergy(reservationId, 'faceswap-failed');
    if (error instanceof InsufficientEnergyError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    console.error('Avatar Swap Error:', error);
    return NextResponse.json({ error: error.message || 'Avatar fehlgeschlagen' }, { status: 500 });
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

  const { id: ventureId } = await params;
  const predictionId = request.nextUrl.searchParams.get('predictionId');

  if (!predictionId) {
    return NextResponse.json({ error: 'predictionId fehlt' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
  }

  const cachedJob = await readJobCache(predictionId);
  if (!cachedJob || cachedJob.userId !== user.id || cachedJob.ventureId !== ventureId) {
    return NextResponse.json({ error: 'Prediction nicht gefunden' }, { status: 404 });
  }

  const prediction = await replicate.predictions.get(predictionId);

  if (prediction.status === 'succeeded') {
    if (!cachedJob.outputUrl) {
      // Extract output URL
      const output = prediction.output;
      let outputUrl: string | null = null;

      if (typeof output === 'string') {
        outputUrl = output;
      } else if (Array.isArray(output) && output.length > 0) {
        outputUrl = typeof output[0] === 'string' ? output[0] : null;
      }

      if (!outputUrl) {
        return NextResponse.json({ status: 'failed', error: 'Kein Output von Replicate' });
      }

      // Download and store in Vercel Blob
      const res = await fetch(outputUrl);
      if (!res.ok) throw new Error('Output konnte nicht geladen werden');
      const blobData = await res.blob();
      const buffer = Buffer.from(await blobData.arrayBuffer());

      const filename = `faceswap/${user.id}/outputs/${Date.now()}-result.mp4`;
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'video/mp4',
      });

      // Save to MediaAsset
      await prisma.mediaAsset.create({
        data: {
          ventureId,
          ownerId: user.id,
          type: 'VIDEO',
          url: blob.url,
          filename,
          mimeType: 'video/mp4',
          size: buffer.length,
          source: 'GENERATED',
          model: cachedJob.model,
          tags: ['faceswap', 'replicate']
        }
      });

      // Settle energy
      if (cachedJob.reservationId) {
        await settleEnergy({
          reservationId: cachedJob.reservationId,
          finalCost: cachedJob.cost,
          provider: 'replicate',
          model: cachedJob.model
        });
      }

      await updateJobCache(predictionId, {
        outputUrl: blob.url,
        settledAt: new Date().toISOString(),
      });

      return NextResponse.json({
        status: 'succeeded',
        outputUrl: blob.url,
        provider: 'replicate',
      });
    }

    return NextResponse.json({
      status: 'succeeded',
      outputUrl: cachedJob.outputUrl,
      provider: 'replicate',
    });
  }

  if (prediction.status === 'failed' || prediction.status === 'canceled') {
    if (!cachedJob.refundedAt && cachedJob.reservationId) {
      await refundEnergy(cachedJob.reservationId, 'faceswap-failed');
      await updateJobCache(predictionId, {
        refundedAt: new Date().toISOString(),
        error: String(prediction.error || 'Avatar fehlgeschlagen'),
      });
    }
    return NextResponse.json({
      status: prediction.status,
      error: cachedJob.error || String(prediction.error) || 'Avatar fehlgeschlagen'
    });
  }

  return NextResponse.json({ status: prediction.status });
}
