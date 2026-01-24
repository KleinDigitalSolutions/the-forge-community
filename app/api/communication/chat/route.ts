import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { callAI } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { message } = await req.json();
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Nachricht fehlt' }, { status: 400 });
    }

    const response = await callAI(
      [
        {
          role: 'system',
          content: 'Du bist der AI Communication Copilot von STAKE & SCALE. Antworte kurz, klar und umsetzbar auf Deutsch.',
        },
        { role: 'user', content: message.trim() },
      ],
      { temperature: 0.5, maxTokens: 700 }
    );

    return NextResponse.json({ reply: response.content, provider: response.provider, model: response.model });
  } catch (error) {
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 });
  }
}
