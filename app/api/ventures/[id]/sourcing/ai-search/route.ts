import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { callAI } from '@/lib/ai';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const venture = await prisma.venture.findUnique({
      where: { id },
      include: { brandDNA: true }
    });

    if (!venture) {
      return NextResponse.json({ error: 'Venture nicht gefunden' }, { status: 404 });
    }

    const category = venture.brandDNA?.productCategory || venture.type;
    const targetMarket = venture.targetMarket || 'Europa';

    const systemPrompt = `
    Du bist ein globaler Sourcing-Experte für Startups. 
    Deine Aufgabe ist es, basierend auf der Produktkategorie und dem Zielmarkt eine Liste von 3-5 potenziellen Lieferantentypen oder echten Herstellern (basierend auf deinem Wissen) zu identifizieren.
    
    Gib die Antwort als valides JSON-Array zurück. Jedes Objekt muss folgende Felder haben:
    - companyName: Name des Herstellers oder Region/Hub
    - country: Land des Hauptsitzes
    - category: Art des Lieferanten (z.B. Fabrik, Großhändler)
    - specialization: Was machen sie besonders gut?
    - moq: Geschätzte Mindestbestellmenge (Zahl oder "Variable")
    - notes: Ein kurzer Tipp für den Gründer.
    `;

    const userPrompt = `
    Suche Lieferanten für: ${category}
    Zielmarkt: ${targetMarket}
    Marken-Kontext: ${venture.brandDNA?.mission || 'Premium Qualität'}
    `;

    const aiResponse = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.3 });

    if (aiResponse.error) throw new Error(aiResponse.error);

    // Parse JSON safely
    let suppliersData;
    try {
      const jsonMatch = aiResponse.content.match(/\[[\s\S]*\]/);
      suppliersData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (e) {
      console.error('Failed to parse AI response as JSON', e);
      suppliersData = [];
    }

    return NextResponse.json({ 
      suppliers: suppliersData,
      explanation: "Diese Vorschläge basieren auf KI-Marktanalysen. Bitte prüfe die Lieferanten individuell."
    });

  } catch (error) {
    console.error('AI Sourcing failed:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
