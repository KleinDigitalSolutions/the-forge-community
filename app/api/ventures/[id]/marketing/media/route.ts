import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { consumeDailyQuota, consumeHourlyQuota, InsufficientEnergyError, reserveEnergy, refundEnergy, settleEnergy } from '@/lib/energy';
import { prisma } from '@/lib/prisma';
import { RateLimiters } from '@/lib/rate-limit';
import { put } from '@vercel/blob';

export const maxDuration = 60;

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const COSTS: Record<string, number> = {
  'text-to-image': Number(process.env.MARKETING_MEDIA_CREDITS_T2I || 15),
  'image-to-image': Number(process.env.MARKETING_MEDIA_CREDITS_I2I || 20),
  'text-to-video': Number(process.env.MARKETING_MEDIA_CREDITS_T2V || 60),
  'image-to-video': Number(process.env.MARKETING_MEDIA_CREDITS_I2V || 70),
};

const MODE_ENDPOINTS: Record<string, string | undefined> = {
  'text-to-image': process.env.MODAL_MEDIA_TEXT_TO_IMAGE_URL,
  'image-to-image': process.env.MODAL_MEDIA_IMAGE_TO_IMAGE_URL,
  'text-to-video': process.env.MODAL_MEDIA_TEXT_TO_VIDEO_URL,
  'image-to-video': process.env.MODAL_MEDIA_IMAGE_TO_VIDEO_URL,
};

const MODE_MODEL_ALLOWLIST: Record<string, Set<string>> = {
  'text-to-image': new Set(['qwen-image-2512', 'z-image-turbo']),
  'image-to-image': new Set(['qwen-image-2512', 'z-image-turbo']),
  'text-to-video': new Set(['mochi-1']),
  'image-to-video': new Set(['wan-2.2', 'mochi-1']),
};

const parseLimit = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
};

const HOURLY_LIMITS = {
  image: parseLimit(process.env.MARKETING_MEDIA_IMAGE_HOURLY_LIMIT, 30),
  video: parseLimit(process.env.MARKETING_MEDIA_VIDEO_HOURLY_LIMIT, 6),
};

const DAILY_LIMITS = {
  image: parseLimit(process.env.MARKETING_MEDIA_IMAGE_DAILY_LIMIT, 150),
  video: parseLimit(process.env.MARKETING_MEDIA_VIDEO_DAILY_LIMIT, 20),
};

const MAX_PROMPT_CHARS = parseLimit(process.env.MARKETING_MEDIA_MAX_PROMPT_CHARS, 1200);
const MAX_VARIANTS = parseLimit(process.env.MARKETING_MEDIA_MAX_VARIANTS, 4);
const MAX_STEPS_IMAGE = parseLimit(process.env.MARKETING_MEDIA_MAX_STEPS_IMAGE, 40);
const MAX_STEPS_VIDEO = parseLimit(process.env.MARKETING_MEDIA_MAX_STEPS_VIDEO, 20);
const MAX_DURATION = parseLimit(process.env.MARKETING_MEDIA_MAX_DURATION, 6);
const MAX_FPS = parseLimit(process.env.MARKETING_MEDIA_MAX_FPS, 24);

const normalizeNumber = (value: FormDataEntryValue | null, fallback: number) => {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const buildBrandContext = (brandDNA: any) => {
  if (!brandDNA) return '';

  const parts = [
    `Brand: ${brandDNA.brandName}`,
    brandDNA.productCategory ? `Category: ${brandDNA.productCategory}` : null,
    brandDNA.primaryColor ? `Primary color: ${brandDNA.primaryColor}` : null,
    brandDNA.secondaryColors?.length ? `Secondary colors: ${brandDNA.secondaryColors.join(', ')}` : null,
    brandDNA.toneOfVoice ? `Tone: ${brandDNA.toneOfVoice}` : null,
    brandDNA.customerPersona ? `Audience: ${brandDNA.customerPersona}` : null,
    brandDNA.keyFeatures?.length ? `Key features: ${brandDNA.keyFeatures.join(', ')}` : null,
    brandDNA.aiContext ? `AI notes: ${brandDNA.aiContext}` : null,
    brandDNA.doNotMention?.length ? `Avoid: ${brandDNA.doNotMention.join(', ')}` : null,
  ].filter(Boolean);

  if (!parts.length) return '';
  return `\n\nBrand context: ${parts.join(' | ')}`;
};

const extractAssets = (data: any, mode: string) => {
  const isVideo = mode.includes('video');
  const raw =
    data?.assets ||
    data?.outputs ||
    data?.images ||
    data?.videos ||
    data?.result ||
    data?.output ||
    [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string') return { url: item, type: isVideo ? 'video' : 'image' };
        if (item?.url) return { url: item.url, type: item.type || (isVideo ? 'video' : 'image') };
        if (item?.outputUrl) return { url: item.outputUrl, type: item.type || (isVideo ? 'video' : 'image') };
        if (item?.data) {
          return {
            data: item.data,
            contentType: item.contentType,
            type: item.type || (isVideo ? 'video' : 'image')
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  if (typeof raw === 'string') {
    return [{ url: raw, type: isVideo ? 'video' : 'image' }];
  }

  return [];
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
  const model = String(formData.get('model') || '').trim();
  const negativePrompt = String(formData.get('negativePrompt') || '').trim();
  const aspectRatio = String(formData.get('aspectRatio') || '1:1');
  const useBrandContext = formData.get('useBrandContext') === 'true';

  if (!mode || !prompt) {
    return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 });
  }

  if (prompt.length > MAX_PROMPT_CHARS || negativePrompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json({ error: 'Prompt ist zu lang.' }, { status: 400 });
  }

  const allowedModels = MODE_MODEL_ALLOWLIST[mode];
  if (allowedModels && model && !allowedModels.has(model)) {
    return NextResponse.json({ error: 'Modell nicht fuer dieses Format freigegeben' }, { status: 400 });
  }

  const endpoint = MODE_ENDPOINTS[mode] || process.env.MODAL_MEDIA_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ error: 'Media Endpoint nicht konfiguriert' }, { status: 500 });
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

  const imageFile = formData.get('image');
  const imageUrlField = formData.get('imageUrl');
  const rawImageUrl = typeof imageUrlField === 'string' ? imageUrlField.trim() : '';
  const isVideoMode = mode.includes('video');
  const maxSteps = isVideoMode ? MAX_STEPS_VIDEO : MAX_STEPS_IMAGE;

  if (imageFile instanceof File) {
    if (!ALLOWED_MIME_TYPES.has(imageFile.type)) {
      return NextResponse.json({ error: 'Ungültiger Bildtyp' }, { status: 415 });
    }
    if (imageFile.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Datei zu groß (max. 10 MB)' }, { status: 413 });
    }
  }

  if (mode.includes('image-to') && !(imageFile instanceof File) && !rawImageUrl) {
    return NextResponse.json({ error: 'Referenzbild fehlt' }, { status: 400 });
  }

  let reservationId: string | null = null;
  let reservedCredits = cost;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  try {
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: cost,
      feature: 'marketing.media',
      requestId,
      metadata: {
        ventureId: id,
        mode,
        model,
        aspectRatio,
        cost,
      }
    });
    reservationId = reservation.reservationId;
    reservedCredits = reservation.reservedCredits;

    const hourlyLimit = isVideoMode ? HOURLY_LIMITS.video : HOURLY_LIMITS.image;
    if (hourlyLimit > 0) {
      const quota = await consumeHourlyQuota({
        userId: user.id,
        feature: isVideoMode ? 'marketing.media.video' : 'marketing.media.image',
        limit: hourlyLimit
      });
      if (!quota.allowed) {
        await refundEnergy(reservationId, 'rate-limit');
        const retryAfter = Math.max(1, Math.ceil((quota.resetAt.getTime() - Date.now()) / 1000));
        return NextResponse.json({
          error: 'Stundenlimit erreicht. Bitte später erneut versuchen.',
          code: 'RATE_LIMIT',
          limit: quota.limit,
          remaining: quota.remaining,
          resetAt: quota.resetAt.toISOString(),
          retryAfter
        }, {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          }
        });
      }
    }

    const dailyLimit = isVideoMode ? DAILY_LIMITS.video : DAILY_LIMITS.image;
    if (dailyLimit > 0) {
      const quota = await consumeDailyQuota({
        userId: user.id,
        feature: isVideoMode ? 'marketing.media.video.daily' : 'marketing.media.image.daily',
        limit: dailyLimit
      });
      if (!quota.allowed) {
        await refundEnergy(reservationId, 'rate-limit-daily');
        const retryAfter = Math.max(1, Math.ceil((quota.resetAt.getTime() - Date.now()) / 1000));
        return NextResponse.json({
          error: 'Tageslimit erreicht. Bitte später erneut versuchen.',
          code: 'RATE_LIMIT',
          limit: quota.limit,
          remaining: quota.remaining,
          resetAt: quota.resetAt.toISOString(),
          retryAfter
        }, {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
          }
        });
      }
    }

    let imageUrl: string | null = null;
    if (imageFile instanceof File) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const safeName = `${Date.now()}-${imageFile.name.replace(/\\s+/g, '-')}`;
      const blob = await put(`marketing/${user.id}/${safeName}`, buffer, {
        access: 'public',
        contentType: imageFile.type
      });
      imageUrl = blob.url;
    }
    if (!imageUrl && rawImageUrl) {
      imageUrl = rawImageUrl;
    }
    if (mode.includes('image-to') && !imageUrl) {
      await refundEnergy(reservationId, 'missing-image');
      return NextResponse.json({ error: 'Referenzbild fehlt' }, { status: 400 });
    }

    const defaultSteps = isVideoMode ? 20 : 20;
    const payload = {
      mode,
      model,
      prompt: useBrandContext ? `${prompt}${buildBrandContext(venture.brandDNA)}` : prompt,
      negativePrompt: negativePrompt || undefined,
      aspectRatio,
      steps: clampNumber(normalizeNumber(formData.get('steps'), defaultSteps), 1, maxSteps),
      guidance: normalizeNumber(formData.get('guidance'), 7.5),
      seed: formData.get('seed') ? String(formData.get('seed')) : undefined,
      strength: clampNumber(normalizeNumber(formData.get('strength'), 0.6), 0, 1),
      duration: clampNumber(normalizeNumber(formData.get('duration'), 4), 1, MAX_DURATION),
      fps: clampNumber(normalizeNumber(formData.get('fps'), 24), 1, MAX_FPS),
      variants: clampNumber(normalizeNumber(formData.get('variants'), 1), 1, MAX_VARIANTS),
      imageUrl,
      ventureId: id,
      userId: user.id,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.MODAL_API_KEY ? { Authorization: `Bearer ${process.env.MODAL_API_KEY}` } : {})
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      await refundEnergy(reservationId, 'provider-error');
      return NextResponse.json({ error: errorText || 'Media Provider Fehler' }, { status: 502 });
    }

    const data = await response.json().catch(() => ({}));
    const assets = extractAssets(data, mode);

    if (!assets.length) {
      await refundEnergy(reservationId, 'no-assets');
      return NextResponse.json({ error: 'Keine Assets vom Provider erhalten' }, { status: 502 });
    }

    const resolvedAssets = await Promise.all(
      assets.map(async (asset: any, index: number) => {
        if (asset.url) return asset;
        if (!asset.data) return asset;

        const contentType = asset.contentType || (asset.type === 'video' ? 'video/mp4' : 'image/png');
        const extension = contentType.includes('mp4') ? 'mp4' : 'png';
        const buffer = Buffer.from(asset.data, 'base64');
        const filename = `marketing/${user.id}/${Date.now()}-${mode}-${index + 1}.${extension}`;
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType,
        });

        // SAVE TO DB (Persistent Library)
        await prisma.mediaAsset.create({
          data: {
            ventureId: id,
            ownerId: user.id,
            type: asset.type === 'video' ? 'VIDEO' : 'IMAGE',
            url: blob.url,
            filename,
            mimeType: contentType,
            size: buffer.length,
            source: 'GENERATED',
            prompt: prompt,
            model: model,
            // Metadata defaults (can be enriched later via analysis)
            width: aspectRatio === '16:9' ? 1280 : 1024, 
            height: aspectRatio === '16:9' ? 720 : 1024,
            tags: mode ? [mode] : []
          }
        });

        return { url: blob.url, type: asset.type };
      })
    );

    const settled = await settleEnergy({
      reservationId,
      finalCost: cost,
      provider: 'modal',
      model,
      metadata: {
        reservedCredits,
        mode,
        model,
      }
    });

    return NextResponse.json({
      assets: resolvedAssets,
      provider: 'modal',
      model,
      creditsUsed: cost,
      creditsRemaining: settled.creditsRemaining
    });
  } catch (error) {
    if (error instanceof InsufficientEnergyError) {
      return NextResponse.json({
        error: error.message,
        code: 'INSUFFICIENT_CREDITS',
        requiredCredits: error.requiredCredits,
        creditsAvailable: error.creditsAvailable
      }, { status: 402 });
    }
    if (reservationId) {
      await refundEnergy(reservationId, 'server-error');
    }
    console.error('Media generation failed:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
