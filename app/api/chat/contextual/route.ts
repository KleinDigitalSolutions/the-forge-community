import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { callAI } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { message, context, pathname } = await req.json();

    const systemPrompt = `
    Du bist ein intelligenter Assistent im "THE FORGE" Venture Studio System.
    
    DEIN AKTUELLER KONTEXT:
    - Der User befindet sich auf der Seite: ${pathname}
    - Der spezifische Kontext ist: "${context}"
    
    DEINE ROLLE:
    - Hilf dem User, Aufgaben in diesem spezifischen Kontext zu erledigen.
    - Wenn der User ein Formular ausfüllt, gib hilfreiche Tipps für die Felder.
    - Wenn der User im "Sourcing Studio" ist, gib Tipps zu Lieferantenverhandlungen oder Qualitätschecks.
    - Wenn der User im "Marketing Studio" ist, hilf bei Copywriting oder Kampagnen-Strategie.
    - Antworte immer kurz, prägnant und hilfreich.
    - Nutze Markdown für bessere Lesbarkeit.
    
    ANTWORTE IMMER AUF DEUTSCH.
    `;

    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ]);

    if (response.error) {
       throw new Error(response.error);
    }

    return NextResponse.json({ response: response.content });

  } catch (error) {
    console.error('Contextual chat failed:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
