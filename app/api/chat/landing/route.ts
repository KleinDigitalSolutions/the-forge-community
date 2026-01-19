import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message required' },
        { status: 400 }
      );
    }

    // Build conversation history
    const messages = [
      {
        role: 'system' as const,
        content: `Du bist Orion, der AI-Guide für "The Forge" - ein Community Venture Studio.

        DEINE AUFGABE:
        - Beantworte Fragen über The Forge, die Mitgliedschaft, den Bewerbungsprozess
        - Sei freundlich, präzise und hilfreich
        - Antworte IMMER auf Deutsch
        - Halte Antworten kurz (max 2-3 Sätze)

        WICHTIGE INFOS:
        - The Forge ist ein Community Venture Studio für 25 Founders
        - Wir bauen gemeinsam profitable Ventures
        - 3 Membership-Tiers: Starter (69€), Growth (99€), Premium (149€)
        - Bewerbung läuft über das Formular auf der Landing Page

        Sei authentisch und direkt. Keine Marketing-Phrasen.`
      },
      ...(history || []).slice(-4).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Call AI with Gemini Flash + Groq fallback
    const response = await callAI(messages, {
      temperature: 0.7,
      maxTokens: 200
    });

    return NextResponse.json({
      message: response.content,
      provider: response.provider
    });
  } catch (error: any) {
    console.error('Landing chat error:', error);
    return NextResponse.json(
      { error: 'Chat service unavailable', message: 'Entschuldigung, ich bin gerade nicht erreichbar. Bitte versuche es später erneut.' },
      { status: 500 }
    );
  }
}
