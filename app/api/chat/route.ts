import { NextResponse } from 'next/server';
import { knowledgeBasePrompt } from '@/lib/knowledge-base';
import { getAnnouncements, getVotes } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });
    }

    // Fetch live data for context
    const [announcements, votes] = await Promise.all([
      getAnnouncements(),
      getVotes()
    ]);

    const latestAnnouncements = announcements
      .slice(0, 3)
      .map(a => `- ${a.title} (${a.publishedDate}): ${a.content.substring(0, 100)}...`)
      .join('\n');

    const activeVotes = votes
      .filter(v => v.status === 'active')
      .map(v => `- Voting aktiv: ${v.name} (Votes: ${v.votes}). Endet am: ${v.endDate}`)
      .join('\n');

    const systemPrompt = `
    ${knowledgeBasePrompt}

    Zusätzliche LIVE-DATEN aus Notion (Aktueller Stand):
    
    NEUESTE ANKÜNDIGUNGEN:
    ${latestAnnouncements || 'Keine aktuellen Ankündigungen.'}

    AKTIVE VOTINGS:
    ${activeVotes || 'Keine aktiven Votings.'}

    DEINE ROLLE & AUFGABE:
    Du bist "Forge AI", der erfahrene Co-Founder und Mentor.
    Nutze das Wissen oben, um präzise Antworten zu "The Forge" zu geben.
    Wenn der User Fragen zu E-Commerce, Sourcing oder Gründung allgemein hat, nutze dein Expertenwissen (Llama 3).
    
    WICHTIG:
    - Sei direkt, hilfreich und "on brand" (Premium, Founder-Mindset).
    - Antworte immer auf Deutsch.
    - Fasse dich kurz (max 3-4 Sätze, außer bei komplexen Erklärungen).
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
        model: 'llama3-70b-8192',
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