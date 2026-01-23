import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { InsufficientEnergyError, reserveEnergy, refundEnergy, settleEnergy } from '@/lib/energy';
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
  'text-to-image': new Set(['qwen-image-2512', 'z-image-turbo', 'glm-image']),
  'image-to-image': new Set(['qwen-image-2512', 'z-image-turbo', 'glm-image']),
  'text-to-video': new Set(['mochi-1']),
  'image-to-video': new Set(['wan-2.2', 'mochi-1']),
};

const normalizeNumber = (value: FormDataEntryValue | null, fallback: number) => {
  if (value === null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
  const rateLimitResponse = await RateLimiters.heavy(request);
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
    where: {
      id,
      OR: [
        { ownerId: user.id },
        {
          squad: {
            members: {
              some: { userId: user.id, leftAt: null }
            }
          }
        }
      ]
    },
    include: { brandDNA: true }
  });

  if (!venture) {
    return NextResponse.json({ error: 'Venture nicht gefunden oder Zugriff verweigert' }, { status: 404 });
  }

  let reservationId: string | null = null;
  let reservedCredits = cost;
  try {
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: cost,
      feature: 'marketing.media',
      requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
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

    const imageFile = formData.get('image');
    const imageUrlField = formData.get('imageUrl');
    let imageUrl: string | null = null;
    if (imageFile instanceof File) {
      if (!ALLOWED_MIME_TYPES.has(imageFile.type)) {
        await refundEnergy(reservationId, 'invalid-image-type');
        return NextResponse.json({ error: 'Ungültiger Bildtyp' }, { status: 415 });
      }
      if (imageFile.size > MAX_UPLOAD_BYTES) {
        await refundEnergy(reservationId, 'image-too-large');
        return NextResponse.json({ error: 'Datei zu groß (max. 10 MB)' }, { status: 413 });
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const safeName = `${Date.now()}-${imageFile.name.replace(/\\s+/g, '-')}`;
      const blob = await put(`marketing/${user.id}/${safeName}`, buffer, {
        access: 'public',
        contentType: imageFile.type
      });
      imageUrl = blob.url;
    }
    if (!imageUrl && typeof imageUrlField === 'string' && imageUrlField.trim()) {
      imageUrl = imageUrlField.trim();
    }
    if (mode.includes('image-to') && !imageUrl) {
      await refundEnergy(reservationId, 'missing-image');
      return NextResponse.json({ error: 'Referenzbild fehlt' }, { status: 400 });
    }

    const payload = {
      mode,
      model,
      prompt: useBrandContext ? `${prompt}${buildBrandContext(venture.brandDNA)}` : prompt,
      negativePrompt: negativePrompt || undefined,
      aspectRatio,
      steps: normalizeNumber(formData.get('steps'), 30),
      guidance: normalizeNumber(formData.get('guidance'), 7.5),
      seed: formData.get('seed') ? String(formData.get('seed')) : undefined,
      strength: normalizeNumber(formData.get('strength'), 0.6),
      duration: normalizeNumber(formData.get('duration'), 4),
      fps: normalizeNumber(formData.get('fps'), 24),
      variants: normalizeNumber(formData.get('variants'), 1),
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
