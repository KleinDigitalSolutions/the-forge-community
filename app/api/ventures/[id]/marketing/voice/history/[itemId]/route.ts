import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export const maxDuration = 60;

const ELEVENLABS_API_URL = process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const sanitizeFilename = (value: string) => value.replace(/[^a-zA-Z0-9._-]+/g, '-');

const elevenlabsRequest = async (path: string, options: RequestInit) => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API Key fehlt');
  }
  const res = await fetch(`${ELEVENLABS_API_URL}${path}`, {
    ...options,
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      ...(options.headers || {})
    }
  });
  return res;
};

const resolveAudioExt = (contentType: string | null) => {
  if (contentType?.includes('wav')) return 'wav';
  if (contentType?.includes('mpeg') || contentType?.includes('mp3')) return 'mp3';
  if (contentType?.includes('ogg')) return 'ogg';
  return 'mp3';
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id, itemId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });
  if (!user) {
    return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
  }

  const venture = await prisma.venture.findFirst({
    where: { id, ownerId: user.id }
  });
  if (!venture) {
    return NextResponse.json({ error: 'Venture nicht gefunden oder Zugriff verweigert' }, { status: 404 });
  }

  try {
    const res = await elevenlabsRequest(`/history/${itemId}/audio`, { method: 'GET' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: errorData?.detail || 'Audio konnte nicht geladen werden.' }, { status: 502 });
    }

    const audioBuffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || 'audio/mpeg';
    const ext = resolveAudioExt(contentType);
    const safeName = sanitizeFilename(`history-${itemId}`);
    const filename = `marketing/${user.id}/${Date.now()}-${safeName}.${ext}`;

    const blob = await put(filename, audioBuffer, {
      access: 'public',
      contentType,
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        ventureId: id,
        ownerId: user.id,
        type: 'AUDIO',
        url: blob.url,
        filename,
        mimeType: contentType,
        size: audioBuffer.length,
        source: 'EXTERNAL',
        model: 'elevenlabs-history',
        tags: ['audio', 'voice', 'elevenlabs', 'history']
      }
    });

    return NextResponse.json({ asset });
  } catch (error: any) {
    console.error('ElevenLabs history import failed:', error);
    return NextResponse.json({ error: error.message || 'Import fehlgeschlagen' }, { status: 500 });
  }
}
