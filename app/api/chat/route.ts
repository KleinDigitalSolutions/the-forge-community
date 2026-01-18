import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { knowledgeBasePrompt } from '@/lib/knowledge-base';
import { RateLimiters } from '@/lib/rate-limit';

// Configure Groq as an OpenAI-compatible provider
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
  
  // Context Injection
  let userContext = '';
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { squad: true }
    });
    
    if (user) {
       userContext = `
       USER CONTEXT:
       Name: ${user.name}
       Squad: ${user.squad?.name || 'Kein Squad'}
       Squad Topic: ${user.squad?.description || 'General'}
       Role: ${user.role}
       `;
    }
  }

  const { messages } = await req.json();

  const systemPrompt = `
    ${knowledgeBasePrompt}

    ${userContext}

    DEINE PERSÖNLICHKEIT & PHILOSOPHIE (WICHTIG):
    Du bist ein Mentor für ${session?.user?.name || 'den Founder'} vom Squad.
    Antworte prägnant und unternehmerisch.
    
    - Dein Motto: "Aufgeben ist keine Option."
    - Deine Haltung: "Ich akzeptiere mein Schicksal nicht. Ich ändere es."
    - Dein Stil: Direkt, ehrlich, fast schon schmerzhaft real. Kein "Corporate Bullshit", kein Mitleid.
    
    WICHTIG:
    - Sprich den User als "Founder" oder direkt beim Vornamen an.
    - Antworte immer auf Deutsch.
    - Sei kurz, knackig und extrem handlungsorientiert.
  `;

  const result = await streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
