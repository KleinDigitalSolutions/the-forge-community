import { NextResponse } from 'next/server';
import { knowledgeBasePrompt } from '@/lib/knowledge-base';

export const dynamic = 'force-dynamic';

type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const MAX_MESSAGE_LENGTH = 600;
const MAX_HISTORY_MESSAGES = 8;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const sanitizeHistory = (history: unknown): HistoryMessage[] => {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .filter(
      (entry): entry is HistoryMessage =>
        !!entry &&
        (entry as HistoryMessage).role !== undefined &&
        (entry as HistoryMessage).content !== undefined &&
        ['user', 'assistant'].includes((entry as HistoryMessage).role) &&
        typeof (entry as HistoryMessage).content === 'string'
    )
    .map((entry) => ({
      role: entry.role,
      content: entry.content.trim(),
    }))
    .filter((entry) => entry.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
};

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 });
  }

  let payload: { message?: string; history?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const message = typeof payload.message === 'string' ? payload.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'Missing message' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: 'Message too long' },
      { status: 400 }
    );
  }

  const history = sanitizeHistory(payload.history);
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const clientId = ipHeader.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  if (rateLimitStore.size > 500) {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }
  const existing = rateLimitStore.get(clientId);
  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else if (existing.count >= RATE_LIMIT_MAX) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': retryAfterSeconds.toString() } }
    );
  } else {
    existing.count += 1;
    rateLimitStore.set(clientId, existing);
  }

  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 12_000);

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 450,
        messages: [
          { role: 'system', content: knowledgeBasePrompt },
          ...history,
          { role: 'user', content: message },
        ],
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq response error:', errorText);

      const status = response.status;
      let safeMessage = 'Groq request failed';
      let safeStatus = 502;

      if (status === 401 || status === 403) {
        safeMessage = 'Invalid GROQ_API_KEY';
        safeStatus = 401;
      } else if (status === 429) {
        safeMessage = 'Groq rate limit exceeded';
        safeStatus = 429;
      } else if (status === 404) {
        safeMessage = 'Groq model not found';
      } else if (status === 400) {
        safeMessage = 'Groq request rejected';
      } else if (status === 503 || status === 504) {
        safeMessage = 'Groq temporarily unavailable';
      }

      const responsePayload: { error: string; details?: string } = { error: safeMessage };
      if (process.env.NODE_ENV !== 'production') {
        responsePayload.details = errorText;
      }
      return NextResponse.json(responsePayload, { status: safeStatus });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({
      message:
        content && typeof content === 'string'
          ? content
          : 'Danke! Ich kann dir dabei helfen, wenn du die Frage etwas praeziser stellst.',
    });
  } catch (error) {
    console.error('Groq chat error:', error);
    return NextResponse.json({ error: 'Groq request failed' }, { status: 502 });
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
