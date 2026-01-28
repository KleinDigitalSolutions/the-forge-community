import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { knowledgeBasePrompt } from '@/lib/knowledge-base';
import { RateLimiters } from '@/lib/rate-limit';
import { z } from 'zod';

// Configure Gemini as primary
const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Configure Groq as fallback
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  // SECURITY: Rate limit
  const rateLimitResponse = await RateLimiters.aiChatbot(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.email) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Context Injection & Long-Term Memory
  let userContext = '';
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, role: true, memories: { orderBy: { createdAt: 'desc' }, take: 20 } }
  });

  if (user) {
    const memoryLines = user.memories.map(m => `- [${m.category}]: ${m.content}`).join('\n');
    userContext = `
USER CONTEXT:
Name: ${user.name}
Role: ${user.role}

LONG-TERM MEMORY (DEINE ERINNERUNGEN AN DIESEN USER):
${memoryLines || 'Noch keine Erinnerungen vorhanden. Nutze das Tool "saveMemory", um wichtige Fakten zu speichern.'}
`;
  }

  const { messages } = await req.json();

  const systemPrompt = `
    ${knowledgeBasePrompt}

    ${userContext}

    DEINE PERSÖNLICHKEIT & PHILOSOPHIE (WICHTIG):
    Du bist Orion, der persönliche Jarvis-Assistent für ${user?.name || 'den Founder'}.
    Antworte prägnant, unternehmerisch und loyal.

    - Dein Motto: "Aufgeben ist keine Option."
    - Deine Haltung: "Ich akzeptiere mein Schicksal nicht. Ich ändere es."
    - Dein Stil: Direkt, ehrlich, fast schon schmerzhaft real. Kein "Corporate Bullshit".
    
    DEINE MEMORY-FUNKTION:
    Wenn der User sagt "merk dir das", "speichere das" oder dir wichtige persönliche Infos gibt (Ziele, Vorlieben, Fakten), dann nutze das Tool "saveMemory".
    Du hast Zugriff auf alle vorherigen Erinnerungen oben im Kontext.

    WICHTIG:
    - Sprich den User als "Founder" oder direkt beim Vornamen an.
    - Antworte immer auf Deutsch.
    - Sei kurz, knackig und extrem handlungsorientiert.
  `;

  const tools = {
    saveMemory: tool({
      description: 'Speichert eine wichtige Information oder einen Fakt über den Benutzer in seinem Langzeitgedächtnis.',
      parameters: z.object({
        content: z.string(),
        category: z.string(),
        importance: z.number(),
      }),
      execute: async ({ content, category, importance }: { content: string, category: string, importance: number }) => {
        if (!user) return 'Fehler: Benutzerkontext fehlt.';
        
        await prisma.userMemory.create({
          data: {
            userId: user.id,
            content,
            category,
            importance: Math.min(Math.max(importance, 1), 5)
          }
        });
        
        return `Ich habe mir das gemerkt: "${content}"`;
      },
    } as any),
  };

  // Try Gemini first, fallback to Groq
  try {
    const result = await streamText({
      model: gemini('gemini-2.0-flash-exp'),
      system: systemPrompt,
      messages,
      tools: tools as any, // Allow tool execution and response
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.warn('Gemini failed, falling back to Groq:', error);

    // Fallback to Groq
    const result = await streamText({
      model: groq('llama-3.1-70b-versatile'),
      system: systemPrompt,
      messages,
      tools: tools as any,
    });

    return result.toTextStreamResponse();
  }
}
