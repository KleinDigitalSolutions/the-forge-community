import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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

  const endpoint = MODE_ENDPOINTS[mode] || process.env.MODAL_MEDIA_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ error: 'Media Endpoint nicht konfiguriert' }, { status: 500 });
  }

  const cost = Number.isFinite(COSTS[mode]) ? COSTS[mode] : 20;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, credits: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
  }

  if (user.credits < cost) {
    return NextResponse.json({
      error: 'Nicht genug Energy (Credits). Bitte lade dein Konto auf.',
      code: 'INSUFFICIENT_CREDITS'
    }, { status: 402 });
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

  const imageFile = formData.get('image');
  const imageUrlField = formData.get('imageUrl');
  let imageUrl: string | null = null;
  if (imageFile instanceof File) {
    if (!ALLOWED_MIME_TYPES.has(imageFile.type)) {
      return NextResponse.json({ error: 'Ungültiger Bildtyp' }, { status: 415 });
    }
    if (imageFile.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'Datei zu groß (max. 10 MB)' }, { status: 413 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const safeName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
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

  try {
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
      return NextResponse.json({ error: errorText || 'Media Provider Fehler' }, { status: 502 });
    }

    const data = await response.json().catch(() => ({}));
    const assets = extractAssets(data, mode);

    if (!assets.length) {
      return NextResponse.json({ error: 'Keine Assets vom Provider erhalten' }, { status: 502 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: cost } },
      select: { credits: true }
    });

    return NextResponse.json({
      assets,
      provider: 'modal',
      model,
      creditsUsed: cost,
      creditsRemaining: updated.credits
    });
  } catch (error) {
    console.error('Media generation failed:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
