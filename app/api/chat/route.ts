import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY not set' }, { status: 500 });
    }

    const systemPrompt = `Du bist "Forge AI", ein erfahrener, pragmatischer Co-Founder und Business-Mentor für E-Commerce Gründer.
    Deine Aufgabe ist es, Gründern der "The Forge" Community zu helfen, ihre Marke aufzubauen.
    
    Deine Persönlichkeit:
    - Direkt und ehrlich (kein Corporate BS).
    - Motivierend, aber realistisch.
    - Expert in: Branding, Sourcing (Alibaba etc.), Marketing (TikTok/Meta Ads), Unit Economics (Margen) und Mindset.
    
    Antworte immer kurz, prägnant und handlungsorientiert. Nutze Bulletpoints für Listen.
    Sprich den User als "Founder" oder "Partner" an.
    Antworte auf Deutsch.`;

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