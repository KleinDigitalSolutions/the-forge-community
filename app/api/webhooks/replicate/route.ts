import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';
import { settleEnergy, refundEnergy } from '@/lib/energy';

// We need the raw body for signature verification
export const dynamic = 'force-dynamic';

const JOB_TTL_MS = 1000 * 60 * 60 * 6;
const jobKeyForPrediction = (predictionId: string) => `replicate:media:${predictionId}`;

const readJobCache = async (predictionId: string) => {
  const record = await prisma.systemCache.findUnique({ where: { key: jobKeyForPrediction(predictionId) } });
  if (!record) return null;
  try {
    return JSON.parse(record.value);
  } catch (error) {
    return null;
  }
};

const writeJobCache = async (predictionId: string, payload: any) => {
  const expiresAt = new Date(Date.now() + JOB_TTL_MS);
  await prisma.systemCache.upsert({
    where: { key: jobKeyForPrediction(predictionId) },
    update: { value: JSON.stringify(payload), expiresAt },
    create: { key: jobKeyForPrediction(predictionId), value: JSON.stringify(payload), expiresAt },
  });
};

const updateJobCache = async (predictionId: string, updates: any) => {
  const existing = await readJobCache(predictionId);
  if (!existing) return null;
  const next = { ...existing, ...updates };
  await writeJobCache(predictionId, next);
  return next;
};

const normalizeOutputUrl = async (item: unknown) => {
  if (!item) return null;
  if (typeof item === 'string') return item;
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

const getAspectDimensions = (aspectRatio: string, isVideo: boolean) => {
  switch (aspectRatio) {
    case '16:9': return isVideo ? { width: 1280, height: 720 } : { width: 1024, height: 576 };
    case '9:16': return isVideo ? { width: 720, height: 1280 } : { width: 576, height: 1024 };
    case '4:5': return isVideo ? { width: 720, height: 900 } : { width: 1024, height: 1280 };
    case '3:2': return isVideo ? { width: 1280, height: 853 } : { width: 1152, height: 768 };
    default: return { width: 1024, height: 1024 };
  }
};

export async function POST(req: NextRequest) {
  try {
    const webhookId = req.headers.get('webhook-id');
    const webhookTimestamp = req.headers.get('webhook-timestamp');
    const webhookSignatures = req.headers.get('webhook-signature');
    const secret = process.env.REPLICATE_WEBHOOK_;

    if (!webhookId || !webhookTimestamp || !webhookSignatures || !secret) {
      return NextResponse.json({ error: 'Missing headers or secret' }, { status: 400 });
    }

    const body = await req.text();
    
    // Signature Verification
    const signedContent = `${webhookId}.${webhookTimestamp}.${body}`;
    const secretKey = secret.startsWith('whsec_') ? secret.split('_')[1] : secret;
    const secretBytes = Buffer.from(secretKey, 'base64');
    const computedSignature = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    const expectedSignatures = webhookSignatures.split(' ').map(sig => sig.split(',')[1]);
    const isValid = expectedSignatures.some(expectedSig => 
      crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(computedSignature))
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const prediction = JSON.parse(body);
    const predictionId = prediction.id;
    const status = prediction.status;

    console.log(`[Replicate Webhook] Processing ${predictionId} with status ${status}`);

    const cachedJob = await readJobCache(predictionId);
    if (!cachedJob) {
      console.warn(`[Replicate Webhook] Job ${predictionId} not found in cache`);
      return NextResponse.json({ ok: true }); // Return OK so Replicate doesn't retry
    }

    if (status === 'succeeded') {
      // Check if already processed
      if (cachedJob.assets) return NextResponse.json({ ok: true });

      const outputUrls = await extractOutputUrls(prediction.output);
      if (!outputUrls.length) {
        await updateJobCache(predictionId, { error: 'No output from Replicate' });
        return NextResponse.json({ ok: true });
      }

      const isVideoMode = cachedJob.outputType === 'video';
      const dimensions = getAspectDimensions(cachedJob.aspectRatio, isVideoMode);

      const resolvedAssets = await Promise.all(
        outputUrls.map(async (url, index) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error('Could not fetch output');
          const blobData = await res.blob();
          const buffer = Buffer.from(await blobData.arrayBuffer());
          const info = getContentInfo(res.headers.get('content-type'), isVideoMode ? 'video' : 'image');

          const filename = `marketing/${cachedJob.userId}/${Date.now()}-${index}.${info.ext}`;
          const blob = await put(filename, buffer, {
            access: 'public',
            contentType: info.contentType,
          });

          await prisma.mediaAsset.create({
            data: {
              ventureId: cachedJob.ventureId,
              ownerId: cachedJob.userId,
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

      // Settle Energy
      let creditsRemaining = cachedJob.creditsRemaining;
      if (cachedJob.reservationId) {
        const settlement = await settleEnergy({
          reservationId: cachedJob.reservationId,
          finalCost: cachedJob.cost,
          provider: 'replicate',
          model: cachedJob.model
        });
        if (settlement?.creditsRemaining !== undefined) {
          creditsRemaining = settlement.creditsRemaining;
        }
      }

      await updateJobCache(predictionId, {
        assets: resolvedAssets,
        settledAt: new Date().toISOString(),
        creditsRemaining,
      });

    } else if (status === 'failed' || status === 'canceled') {
      if (!cachedJob.refundedAt && cachedJob.reservationId) {
        await refundEnergy(cachedJob.reservationId, 'generation-failed');
        await updateJobCache(predictionId, {
          refundedAt: new Date().toISOString(),
          error: prediction.error || 'Generation failed'
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Replicate Webhook Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
