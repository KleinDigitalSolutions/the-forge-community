import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

const ELEVENLABS_API_URL = process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;
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

  const pageSize = request.nextUrl.searchParams.get('pageSize');
  const startAfter = request.nextUrl.searchParams.get('startAfter');

  const url = new URL(`${ELEVENLABS_API_URL}/history`);
  if (pageSize) url.searchParams.set('page_size', pageSize);
  if (startAfter) url.searchParams.set('start_after_history_item_id', startAfter);

  try {
    const res = await elevenlabsRequest(url.pathname + url.search, { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ error: data?.detail || 'History konnte nicht geladen werden.' }, { status: 502 });
    }
    return NextResponse.json({ history: data });
  } catch (error: any) {
    console.error('ElevenLabs history fetch failed:', error);
    return NextResponse.json({ error: error.message || 'ElevenLabs API Fehler' }, { status: 500 });
  }
}
