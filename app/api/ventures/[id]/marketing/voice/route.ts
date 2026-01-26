import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { consumeHourlyQuota, InsufficientEnergyError, reserveEnergy, refundEnergy, settleEnergy } from '@/lib/energy';
import { put } from '@vercel/blob';

export const maxDuration = 60;

const ELEVENLABS_API_URL = process.env.ELEVENLABS_API_URL || 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const parseLimit = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
};

const MAX_TTS_CHARS = parseLimit(process.env.MARKETING_VOICE_MAX_CHARS, 5000);
const VOICE_COST = parseLimit(process.env.MARKETING_VOICE_CREDITS, 5);
const HOURLY_VOICE_LIMIT = parseLimit(process.env.MARKETING_VOICE_HOURLY_LIMIT, 40);

const clamp01 = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(1, Math.max(0, parsed));
};

const resolveAudioExt = (contentType: string | null, outputFormat: string | undefined) => {
  if (outputFormat?.startsWith('wav')) return 'wav';
  if (outputFormat?.startsWith('mp3')) return 'mp3';
  if (contentType?.includes('wav')) return 'wav';
  if (contentType?.includes('mpeg') || contentType?.includes('mp3')) return 'mp3';
  if (contentType?.includes('ogg')) return 'ogg';
  return 'mp3';
};

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const voicesRes = await elevenlabsRequest('/voices', { method: 'GET' });
    const modelsRes = await elevenlabsRequest('/models', { method: 'GET' });

    const voicesData = await voicesRes.json().catch(() => ({}));
    const modelsData = await modelsRes.json().catch(() => ([]));

    if (!voicesRes.ok) {
      return NextResponse.json({ error: voicesData?.detail || 'Voices konnten nicht geladen werden.' }, { status: 502 });
    }
    if (!modelsRes.ok) {
      return NextResponse.json({ error: modelsData?.detail || 'Models konnten nicht geladen werden.' }, { status: 502 });
    }

    const voices = Array.isArray(voicesData?.voices) ? voicesData.voices : [];
    const models = Array.isArray(modelsData)
      ? modelsData.filter((model: any) => model?.can_do_text_to_speech)
      : [];

    return NextResponse.json({
      voices,
      models,
    });
  } catch (error: any) {
    console.error('ElevenLabs meta fetch failed:', error);
    return NextResponse.json({ error: error.message || 'ElevenLabs API Fehler' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request' }, { status: 400 });
  }

  const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
  const voiceId = typeof payload?.voiceId === 'string' ? payload.voiceId.trim() : '';
  const modelId = typeof payload?.modelId === 'string' ? payload.modelId.trim() : '';
  const outputFormat = typeof payload?.outputFormat === 'string' ? payload.outputFormat.trim() : 'mp3_44100_128';
  const languageCode = typeof payload?.languageCode === 'string' ? payload.languageCode.trim() : undefined;
  const originTag = typeof payload?.originTag === 'string' ? payload.originTag.trim() : undefined;

  if (!text) {
    return NextResponse.json({ error: 'Text fehlt.' }, { status: 400 });
  }
  if (text.length > MAX_TTS_CHARS) {
    return NextResponse.json({ error: 'Text ist zu lang.' }, { status: 400 });
  }

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

  const voiceProfile = (prisma as any).voiceProfile;
  const profile = voiceProfile
    ? await voiceProfile.findUnique({ where: { ventureId: id } })
    : null;

  const resolvedVoiceId = voiceId || profile?.voiceId || '';
  const resolvedModelId = modelId || profile?.modelId || 'eleven_multilingual_v2';
  const dictionaryId = typeof payload?.pronunciationDictionaryId === 'string'
    ? payload.pronunciationDictionaryId.trim()
    : profile?.pronunciationDictionaryId || '';
  const dictionaryVersionId = typeof payload?.pronunciationDictionaryVersionId === 'string'
    ? payload.pronunciationDictionaryVersionId.trim()
    : profile?.pronunciationDictionaryVersionId || '';

  if (!resolvedVoiceId) {
    return NextResponse.json({ error: 'Bitte wähle eine Stimme.' }, { status: 400 });
  }

  let reservationId: string | null = null;
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const reservation = await reserveEnergy({
      userId: user.id,
      amount: VOICE_COST,
      feature: 'marketing.voice',
      requestId,
      metadata: { ventureId: id, model: resolvedModelId, voiceId: resolvedVoiceId }
    });
    reservationId = reservation.reservationId;

    const quota = await consumeHourlyQuota({
      userId: user.id,
      feature: 'marketing.voice.audio',
      limit: HOURLY_VOICE_LIMIT
    });

    if (!quota.allowed) {
      await refundEnergy(reservationId, 'rate-limit');
      return NextResponse.json({ error: 'Stundenlimit erreicht.' }, { status: 429 });
    }

    const rawVoiceSettings = payload?.voiceSettings && typeof payload.voiceSettings === 'object'
      ? payload.voiceSettings
      : profile?.voiceSettings;

    const voiceSettings = rawVoiceSettings && typeof rawVoiceSettings === 'object'
      ? {
          stability: clamp01((rawVoiceSettings as any).stability, 0.4),
          similarity_boost: clamp01((rawVoiceSettings as any).similarity_boost, 0.8),
          style: clamp01((rawVoiceSettings as any).style, 0.2),
          use_speaker_boost: Boolean((rawVoiceSettings as any).use_speaker_boost)
        }
      : undefined;

    const requestBody: Record<string, any> = {
      text,
      model_id: resolvedModelId,
    };
    if (languageCode) requestBody.language_code = languageCode;
    if (voiceSettings) requestBody.voice_settings = voiceSettings;
    if (dictionaryId && dictionaryVersionId) {
      requestBody.pronunciation_dictionary_locators = [
        {
          pronunciation_dictionary_id: dictionaryId,
          version_id: dictionaryVersionId
        }
      ];
    }

    const url = new URL(`${ELEVENLABS_API_URL}/text-to-speech/${resolvedVoiceId}`);
    if (outputFormat) url.searchParams.set('output_format', outputFormat);

    const response = await elevenlabsRequest(url.pathname + url.search, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.detail || errorData?.error || 'ElevenLabs Anfrage fehlgeschlagen.';
      throw new Error(message);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    const ext = resolveAudioExt(contentType, outputFormat);
    const safeName = sanitizeFilename(`voice-${resolvedVoiceId}`);
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
        source: 'GENERATED',
        prompt: text,
        model: resolvedModelId,
        tags: ['audio', 'voice', 'elevenlabs', ...(originTag ? [originTag] : [])]
      }
    });

    const settlement = reservationId
      ? await settleEnergy({
          reservationId,
          finalCost: VOICE_COST,
          provider: 'elevenlabs',
          model: resolvedModelId,
          metadata: {
            voiceId: resolvedVoiceId,
            outputFormat,
            characters: text.length
          }
        })
      : null;

    return NextResponse.json({
      asset,
      creditsUsed: VOICE_COST,
      creditsRemaining: settlement?.creditsRemaining ?? null
    });
  } catch (error: any) {
    if (reservationId) await refundEnergy(reservationId, 'voice-failed');
    if (error instanceof InsufficientEnergyError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    console.error('ElevenLabs voice error:', error);
    return NextResponse.json({ error: error.message || 'Voice-Generierung fehlgeschlagen' }, { status: 500 });
  }
}
