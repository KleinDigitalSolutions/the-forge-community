import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool, convertToModelMessages } from 'ai';
import { getUserFullContext } from '@/lib/ai/context';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Nachrichten fehlen' }, { status: 400 });
    }

    const userContext = await getUserFullContext(session.user.email);
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });

    const systemPrompt = `
      Du bist Orion, der persönliche Jarvis-Assistent von STAKE & SCALE.
      Du hast Zugriff auf alle Daten des Benutzers innerhalb der Plattform.
      
      ${userContext}
      
      DEINE MISSION:
      - Sei der ultimative Co-Founder.
      - Antworte kurz, prägnant und unternehmerisch.
      - Wenn der User dir Informationen gibt, die für die Zukunft wichtig sind, nutze "saveMemory".
      - Wenn der User fragt "Was weißt du über mich?" oder "Was sind meine Ziele?", beziehe dich auf LONG-TERM MEMORY und VENTURES.
      
      ANTWORTE IMMER AUF DEUTSCH.
    `;

    const result = await streamText({
      model: gemini('gemini-2.0-flash-exp'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: {
        saveMemory: tool({
          description: 'Speichert eine Information im Langzeitgedächtnis des Benutzers.',
          parameters: z.object({
            content: z.string(),
            category: z.string(),
          }),
          execute: async ({ content, category }: { content: string, category: string }) => {
            if (!user) return 'Fehler: Benutzer nicht gefunden.';
            await prisma.userMemory.create({
              data: {
                userId: user.id,
                content,
                category,
                importance: 3
              }
            });
            return `Erinnerung gespeichert: ${content}`;
          }
        } as any)
      } as any,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Jarvis chat failed:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 });
  }
}
