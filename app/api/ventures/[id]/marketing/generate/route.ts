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
    const { contentType, topic, additionalInstructions } = await req.json();

    if (!contentType || !topic) {
      return NextResponse.json({ error: 'Fehlende Parameter' }, { status: 400 });
    }

    // Get user with credits
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, credits: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // CREDIT CHECK
    const COST = 10;
    if (user.credits < COST) {
      return NextResponse.json({ 
        error: 'Nicht genug Energy (Credits). Bitte lade dein Konto auf.',
        code: 'INSUFFICIENT_CREDITS' 
      }, { status: 402 });
    }

    // Verify access to venture and get BrandDNA
    const venture = await prisma.venture.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: user.id },
          {
            squad: {
              members: {
                some: {
                  userId: user.id,
                  leftAt: null
                }
              }
            }
          }
        ]
      },
      include: {
        brandDNA: true
      }
    });

    if (!venture) {
      return NextResponse.json({ error: 'Venture nicht gefunden oder Zugriff verweigert' }, { status: 404 });
    }

    const brandDNA = venture.brandDNA;
    const brandContext = brandDNA ? `
    MARKEN-KONTEXT:
    - Markenname: ${brandDNA.brandName}
    - Mission: ${brandDNA.mission || 'Nicht definiert'}
    - Tonfall: ${brandDNA.toneOfVoice || 'Professionell'}
    - Zielgruppe: ${brandDNA.customerPersona || 'Nicht definiert'}
    - Schreibstil: ${brandDNA.writingStyle || 'Klar und direkt'}
    - Spezielle Anweisungen: ${brandDNA.aiContext || 'Keine'}
    - Zu vermeiden: ${brandDNA.doNotMention?.join(', ') || 'Nichts'}
    ` : 'Kein spezifischer Marken-Kontext vorhanden. Nutze einen professionellen, modernen Startup-Stil.';

    const systemPrompt = `
    Du bist ein erfahrener Marketing-Copywriter für das Startup "${venture.name}".
    Deine Aufgabe ist es, hochwertigen Marketing-Content zu erstellen, der perfekt zur Markenidentität passt.

    ${brandContext}

    FORMATIERUNG:
    - Nutze Markdown für Fettgedrucktes, Listen, etc.
    - Sei kreativ aber authentisch.
    - Antworte IMMER auf Deutsch.
    `;

    const userPrompt = `
    Erstelle Content für: ${contentType}
    Thema: ${topic}
    Zusätzliche Anweisungen: ${additionalInstructions || 'Keine'}
    `;

    const aiResponse = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]);

    if (aiResponse.error) {
       throw new Error(aiResponse.error);
    }

    // Save to database & Deduct Credits
    await prisma.$transaction([
      prisma.marketingContent.create({
        data: {
          ventureId: id,
          contentType,
          prompt: userPrompt,
          generatedContent: aiResponse.content,
          createdById: user.id
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: COST } }
      })
    ]);

    return NextResponse.json({ 
      content: aiResponse.content,
      provider: aiResponse.provider,
      creditsRemaining: user.credits - COST
    });

  } catch (error) {
    console.error('Marketing generation failed:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
