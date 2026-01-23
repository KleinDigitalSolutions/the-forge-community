import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { consumeDailyQuota, consumeHourlyQuota, InsufficientEnergyError, reserveEnergy, refundEnergy, settleEnergy } from '@/lib/energy';
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
  'text-to-image': 4,   // Much cheaper via API
  'image-to-image': 8,
  'text-to-video': 35,
  'image-to-video': 40,
};

// Replicate Models
const MODELS = {
  IMAGE: "black-forest-labs/flux-schnell", // Fast, high quality, cheap
  VIDEO: "wan-video/wan-2.1-1.3b" // Efficient video generation
};

const parseLimit = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
};

const HOURLY_LIMITS = {
  image: parseLimit(process.env.MARKETING_MEDIA_IMAGE_HOURLY_LIMIT, 50),
  video: parseLimit(process.env.MARKETING_MEDIA_VIDEO_HOURLY_LIMIT, 10),
};

const DAILY_LIMITS = {
  image: parseLimit(process.env.MARKETING_MEDIA_IMAGE_DAILY_LIMIT, 200),
  video: parseLimit(process.env.MARKETING_MEDIA_VIDEO_DAILY_LIMIT, 30),
};

const MAX_PROMPT_CHARS = parseLimit(process.env.MARKETING_MEDIA_MAX_PROMPT_CHARS, 1200);

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

  const mode = String(formData.get('mode') || '');
  const prompt = String(formData.get('prompt') || '').trim();
  const aspectRatio = String(formData.get('aspectRatio') || '1:1');
  const useBrandContext = formData.get('useBrandContext') === 'true';

  if (!mode || !prompt) {
    return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 });
  }

  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'Replicate API Token fehlt' }, { status: 500 });
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

  // --- 1. Reserve Energy ---
  let reservationId: string | null = null;
  let reservedCredits = cost;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: cost,
      feature: 'marketing.media',
      requestId,
      metadata: { ventureId: id, mode, cost }
    });
    reservationId = reservation.reservationId;
    reservedCredits = reservation.reservedCredits;

    // --- 2. Check Quotas ---
    const isVideoMode = mode.includes('video');
    const hourlyLimit = isVideoMode ? HOURLY_LIMITS.video : HOURLY_LIMITS.image;
    
    const quota = await consumeHourlyQuota({
      userId: user.id,
      feature: isVideoMode ? 'marketing.media.video' : 'marketing.media.image',
      limit: hourlyLimit
    });
    
    if (!quota.allowed) {
      await refundEnergy(reservationId, 'rate-limit');
      return NextResponse.json({ error: 'Stundenlimit erreicht.' }, { status: 429 });
    }

    // --- 3. Run Replicate Generation ---
    const finalPrompt = useBrandContext ? `${prompt}${buildBrandContext(venture.brandDNA)}` : prompt;
    let output: any;

    if (isVideoMode) {
       // Video Generation Logic
       output = await replicate.run(MODELS.VIDEO, {
        input: {
          prompt: finalPrompt,
          aspect_ratio: aspectRatio,
          negative_prompt: formData.get('negativePrompt') as string
        }
      });
    } else {
      // Image Generation Logic (Flux Schnell)
      output = await replicate.run(MODELS.IMAGE, {
        input: {
          prompt: finalPrompt,
          aspect_ratio: aspectRatio,
          output_format: "png",
          output_quality: 90
        }
      });
    }

    // --- 4. Process Results ---
    // Replicate output varies: sometimes array of strings (URLs), sometimes ReadableStream
    let assetsToProcess: string[] = [];
    if (Array.isArray(output)) {
      assetsToProcess = output.map(String); // ensure strings
    } else if (typeof output === 'string') {
      assetsToProcess = [output];
    } else if (output && typeof output === 'object') {
       // Handle stream or other object types if necessary
       // For Flux/Wan, it usually returns URLs (strings) or an array of them
       console.log('Replicate output unknown type:', output);
       throw new Error('Unbekanntes Output-Format von Replicate');
    }

    if (!assetsToProcess.length) {
      throw new Error('Kein Output von Replicate');
    }

    const resolvedAssets = await Promise.all(
      assetsToProcess.map(async (url, index) => {
        // Fetch and Upload to Blob for permanence
        const res = await fetch(url);
        const blobData = await res.blob();
        const buffer = Buffer.from(await blobData.arrayBuffer());
        
        const ext = isVideoMode ? 'mp4' : 'png';
        const contentType = isVideoMode ? 'video/mp4' : 'image/png';
        const filename = `marketing/${user.id}/${Date.now()}-${index}.${ext}`;
        
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType,
        });

        // Save to DB
        await prisma.mediaAsset.create({
          data: {
            ventureId: id,
            ownerId: user.id,
            type: isVideoMode ? 'VIDEO' : 'IMAGE',
            url: blob.url,
            filename,
            mimeType: contentType,
            size: buffer.length,
            source: 'GENERATED',
            prompt: prompt,
            model: isVideoMode ? MODELS.VIDEO : MODELS.IMAGE,
            width: aspectRatio === '16:9' ? 1280 : 1024,
            height: aspectRatio === '16:9' ? 720 : 1024,
            tags: [mode, 'replicate']
          }
        });

        return { url: blob.url, type: isVideoMode ? 'video' : 'image' };
      })
    );

    // --- 5. Settle Energy ---
    await settleEnergy({
      reservationId,
      finalCost: cost,
      provider: 'replicate',
      model: isVideoMode ? MODELS.VIDEO : MODELS.IMAGE
    });

    return NextResponse.json({
      assets: resolvedAssets,
      provider: 'replicate',
      creditsUsed: cost
    });

  } catch (error: any) {
    if (reservationId) await refundEnergy(reservationId, 'generation-failed');
    console.error('Replicate Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
