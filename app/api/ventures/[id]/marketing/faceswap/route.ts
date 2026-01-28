import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { reserveEnergy, refundEnergy, settleEnergy, InsufficientEnergyError, checkDailyVideoQuota } from '@/lib/energy';
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

const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime']);
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

  if (!isFileLike(videoFile) || !isFileLike(faceFile)) {
    return NextResponse.json({ error: 'Video und Face Image sind erforderlich' }, { status: 400 });
  }

  const modelConfig = FACESWAP_MODELS[modelKey];
  if (!modelConfig) {
    return NextResponse.json({ error: 'Ungültiges Modell' }, { status: 400 });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Replicate API Token fehlt' }, { status: 500 });
  }

  // Validate files
  if (videoFile.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: 'Video ist zu groß (max 50MB)' }, { status: 413 });
  }
  if (faceFile.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Face Image ist zu groß (max 10MB)' }, { status: 413 });
  }
  if (!ALLOWED_VIDEO_TYPES.has(videoFile.type)) {
    return NextResponse.json({ error: 'Ungültiges Video-Format (nur MP4/MOV)' }, { status: 415 });
  }
  if (!ALLOWED_IMAGE_TYPES.has(faceFile.type)) {
    return NextResponse.json({ error: 'Ungültiges Bild-Format (nur JPG/PNG/WebP)' }, { status: 415 });
  }

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

  const cost = modelConfig.cost;
  let reservationId: string | null = null;
  const requestId = request.headers.get('x-request-id') || generateUUID();

  try {
    // Step 1: Reserve credits
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: cost,
      feature: 'marketing.faceswap',
      requestId,
      metadata: { ventureId, model: modelConfig.id, cost }
    });
    reservationId = reservation.reservationId;

    // Step 2: Check daily video quota (face swap is heavy like video)
    const dailyQuota = await checkDailyVideoQuota(user.id);
    if (!dailyQuota.allowed) {
      await refundEnergy(reservationId, 'daily-quota-exceeded');
      return NextResponse.json({
        error: `Tageslimit für Face Swap erreicht (${dailyQuota.limit}/Tag). Reset: ${dailyQuota.resetAt.toLocaleTimeString('de-DE')}`,
        quota: {
          limit: dailyQuota.limit,
          remaining: dailyQuota.remaining,
          resetAt: dailyQuota.resetAt.toISOString()
        }
      }, { status: 429 });
    }

    // Step 3: Upload files to Vercel Blob
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
    const faceBuffer = Buffer.from(await faceFile.arrayBuffer());

    const videoFilename = `faceswap/${user.id}/videos/${Date.now()}-${sanitizeFilename(videoFile.name)}`;
    const faceFilename = `faceswap/${user.id}/faces/${Date.now()}-${sanitizeFilename(faceFile.name)}`;

    const videoBlob = await put(videoFilename, videoBuffer, {
      access: 'public',
      contentType: videoFile.type,
    });

    const faceBlob = await put(faceFilename, faceBuffer, {
      access: 'public',
      contentType: faceFile.type,
    });

    // Step 4: Create Replicate prediction
    const input: Record<string, unknown> = {
      target_video: videoBlob.url,
      swap_image: faceBlob.url,
    };

    // Model-specific configurations
    if (modelKey === 'lucataco-faceswap') {
      input.swap_condition = swapCondition; // 'all' or 'first'
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    const webhookUrl = appUrl ? `${appUrl}/api/webhooks/replicate` : undefined;

    const prediction = await replicate.predictions.create({
      model: modelConfig.id,
      input,
      ...(webhookUrl ? {
        webhook: webhookUrl,
        webhook_events_filter: ['completed'],
      } : {}),
    });

    // Step 5: Cache job data
    await writeJobCache(prediction.id, {
      ventureId,
      userId: user.id,
      model: modelConfig.id,
      cost,
      reservationId,
      videoUrl: videoBlob.url,
      faceUrl: faceBlob.url,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      predictionId: prediction.id,
      status: prediction.status,
      provider: 'replicate',
      model: modelConfig.label,
      creditsUsed: cost,
    });
  } catch (error: any) {
    if (reservationId) await refundEnergy(reservationId, 'faceswap-failed');
    if (error instanceof InsufficientEnergyError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    console.error('Face Swap Error:', error);
    return NextResponse.json({ error: error.message || 'Face Swap fehlgeschlagen' }, { status: 500 });
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
        error: String(prediction.error || 'Face Swap fehlgeschlagen'),
      });
    }
    return NextResponse.json({
      status: prediction.status,
      error: cachedJob.error || String(prediction.error) || 'Face Swap fehlgeschlagen'
    });
  }

  return NextResponse.json({ status: prediction.status });
}
