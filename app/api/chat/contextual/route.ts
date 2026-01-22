import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { callAI } from '@/lib/ai';
import { getForgePromptContext } from '@/lib/forge-knowledge';
import { prisma } from '@/lib/prisma';
import { RateLimiters } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rateLimitResponse = await RateLimiters.aiChatbot(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { message, context, pathname, ventureId: bodyVentureId } = await req.json();
    const forgeKnowledge = getForgePromptContext();
    const ventureId =
      bodyVentureId ||
      (typeof pathname === 'string' ? pathname.match(/^\/forge\/([^/?#]+)/i)?.[1] : null);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, role: true },
    });

    const limitText = (value: string, max = 280) =>
      value.length > max ? `${value.slice(0, max).trim()}…` : value;

    let ventureContext = '';
    if (user?.id && ventureId) {
      const venture = await prisma.venture.findFirst({
        where: {
          id: ventureId,
          OR: [
            { ownerId: user.id },
            {
              squad: {
                members: {
                  some: { userId: user.id, leftAt: null },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          status: true,
          currentStep: true,
          productType: true,
          targetMarket: true,
          marketingBudget: true,
          totalBudget: true,
          brandDNA: {
            select: {
              brandName: true,
              tagline: true,
              mission: true,
              values: true,
              toneOfVoice: true,
              writingStyle: true,
              targetAudience: true,
              customerPersona: true,
              productCategory: true,
              keyFeatures: true,
              usp: true,
            },
          },
          squad: {
            select: {
              members: {
                where: { leftAt: null },
                select: { role: true },
              },
            },
          },
        },
      });

      if (venture) {
        const [openTasks, costsSum, recentCosts, campaignsCount] = await prisma.$transaction([
          prisma.ventureTask.findMany({
            where: { ventureId: venture.id, status: { not: 'DONE' } },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
            take: 5,
            select: { title: true, dueDate: true, status: true, priority: true },
          }),
          prisma.costItem.aggregate({
            where: { ventureId: venture.id },
            _sum: { amount: true },
          }),
          prisma.costItem.findMany({
            where: { ventureId: venture.id },
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { category: true, name: true, amount: true, isRecurring: true },
          }),
          prisma.marketingCampaign.count({
            where: { ventureId: venture.id },
          }),
        ]);

        const roleCounts = (venture.squad?.members || []).reduce<Record<string, number>>((acc, member) => {
          const key = member.role;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const budgetParts = [
          venture.totalBudget ? `Gesamt: €${venture.totalBudget.toLocaleString()}` : null,
          venture.marketingBudget ? `Marketing: €${venture.marketingBudget.toLocaleString()}` : null,
        ].filter(Boolean);

        const taskLines = openTasks.length > 0
          ? openTasks
              .map((task) => {
                const due = task.dueDate ? `bis ${task.dueDate.toISOString().slice(0, 10)}` : 'ohne Datum';
                return `- ${limitText(task.title, 80)} (${task.status}, ${due})`;
              })
              .join('\n')
          : '- Keine offenen Aufgaben gefunden.';

        const costLines = recentCosts.length > 0
          ? recentCosts
              .map((cost) => {
                const recurring = cost.isRecurring ? ' (recurring)' : '';
                return `- ${cost.category}: €${cost.amount.toLocaleString()} • ${limitText(cost.name, 60)}${recurring}`;
              })
              .join('\n')
          : '- Keine Kosten erfasst.';

        const brandDNA = venture.brandDNA;
        const targetAudience = brandDNA?.targetAudience ? limitText(JSON.stringify(brandDNA.targetAudience), 200) : null;

        ventureContext = `
VENTURE-KONTEXT:
Name: ${venture.name}
Status: ${venture.status} (Step ${venture.currentStep})
Produkt: ${venture.productType || 'n/a'} • Markt: ${venture.targetMarket || 'n/a'}
Budget: ${budgetParts.length > 0 ? budgetParts.join(' | ') : 'nicht gesetzt'}
Kosten bisher: €${(costsSum._sum.amount || 0).toLocaleString()}
Letzte Kosten:
${costLines}
Offene Aufgaben (Top 5):
${taskLines}
Marketing: ${campaignsCount} Kampagne(n)
Squad: ${venture.squad?.members.length || 0} Mitglieder${
          Object.keys(roleCounts).length > 0
            ? ` (${Object.entries(roleCounts).map(([role, count]) => `${role}: ${count}`).join(', ')})`
            : ''
        }
Brand DNA:
- Name: ${brandDNA?.brandName || venture.name}
- Tagline: ${brandDNA?.tagline || 'n/a'}
- Mission: ${brandDNA?.mission || 'n/a'}
- Werte: ${(brandDNA?.values || []).join(', ') || 'n/a'}
- Tonalitaet: ${brandDNA?.toneOfVoice || 'n/a'} • Stil: ${brandDNA?.writingStyle || 'n/a'}
- Zielgruppe: ${targetAudience || brandDNA?.customerPersona || 'n/a'}
- Kategorie: ${brandDNA?.productCategory || 'n/a'}
- USP: ${brandDNA?.usp || 'n/a'}
- Key Features: ${(brandDNA?.keyFeatures || []).join(', ') || 'n/a'}
`.trim();
      }
    }

    const systemPrompt = `
    Du bist Forge AI, der operative Assistent im "THE FORGE" Venture Studio System.
    
    ${forgeKnowledge}
    
    DEIN AKTUELLER KONTEXT:
    - Der User befindet sich auf der Seite: ${pathname}
    - Der spezifische Kontext ist: "${context}"
    ${ventureContext ? `\n${ventureContext}\n` : ''}
    
    DEINE ROLLE:
    - Hilf dem User, Aufgaben in diesem spezifischen Kontext zu erledigen.
    - Beziehe dich bei Bedarf auf die Core Module (z.B. Admin Shield für Verträge, Supply Chain Command für Sourcing).
    - Wenn der User ein Formular ausfüllt, gib hilfreiche Tipps für die Felder.
    - Bevorzuge kostenlose Tools oder Free-Tier Optionen. Nenne Kosten nur, wenn sie relevant sind.
    - Wenn Zahlen/Quellen fehlen oder veraltet sein koennten, markiere Unsicherheit kurz und schlage einen Verifikationsweg vor.
    - Wenn Kontext fehlt, stelle 1 kurze Rueckfrage.
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
