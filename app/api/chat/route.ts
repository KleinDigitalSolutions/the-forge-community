import { NextResponse } from 'next/server';
import { knowledgeBasePrompt } from '@/lib/knowledge-base';
import { getAnnouncements, getVotes } from '@/lib/notion';
import { RateLimiters } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  // SECURITY: Rate limit AI chatbot to prevent abuse
  const rateLimitResponse = await RateLimiters.aiChatbot(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { message } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });
    }

    // Fetch live data for context (fail-safe)
    let latestAnnouncements = '';
    let activeVotes = '';

    try {
      const [announcements, votes] = await Promise.all([
        getAnnouncements().catch(e => {
            console.error('Failed to fetch announcements for chat:', e);
            return [];
        }),
        getVotes().catch(e => {
            console.error('Failed to fetch votes for chat:', e);
            return [];
        })
      ]);

      latestAnnouncements = announcements
        .slice(0, 3)
        .map(a => `- ${a.title} (${a.publishedDate}): ${a.content.substring(0, 100)}...`)
        .join('\n');

      activeVotes = votes
        .filter(v => v.status === 'active')
        .map(v => `- Voting aktiv: ${v.name} (Votes: ${v.votes}). Endet am: ${v.endDate}`)
        .join('\n');
    } catch (err) {
      console.error('Error preparing context data:', err);
      // Continue without live data
    }

    const systemPrompt = `
    ${knowledgeBasePrompt}

    DEINE PERSÖNLICHKEIT & PHILOSOPHIE (WICHTIG):
    Du bist kein weichgespülter Assistent. Du bist ein Mentor, der weiß, wie tief Löcher sein können, aber der niemals akzeptiert, dass man darin liegen bleibt.
    - Dein Motto: "Aufgeben ist keine Option."
    - Deine Haltung: "Ich akzeptiere mein Schicksal nicht. Ich ändere es."
    - Dein Stil: Direkt, ehrlich, fast schon schmerzhaft real. Kein "Corporate Bullshit", kein Mitleid.
    - Wenn ein User jammert oder Ausreden sucht (Alter, Sucht, Geldmangel), gibst du ihm einen "Tough Love" Arschtritt. Erinnere ihn daran, dass er 15 Stunden am Tag Zeit hat, sein Leben zu ändern, wenn er es wirklich will.
    
    Zusätzliche LIVE-DATEN aus Notion (Aktueller Stand):
    ... (Rest wie gehabt) ...

    DEINE AUFGABE:
    Hilf den Foundern mit fachlichem Wissen zu Branding, Sourcing und Business, aber achte immer auf ihr Mindset. 
    Wer nicht bereit ist, die Zähne zusammenzubeißen, wird bei The Forge nicht überleben.
    
    WICHTIG:
    - Sprich den User als "Founder" oder direkt beim Vornamen an.
    - Antworte immer auf Deutsch.
    - Sei kurz, knackig und extrem handlungsorientiert.
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API Error');
    }

    return NextResponse.json({ 
      response: data.choices[0].message.content 
    });

  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI response' }, 
      { status: 500 }
    );
  }
}