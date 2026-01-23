import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { callAI } from '@/lib/ai';
import { getForgePromptContext } from '@/lib/forge-knowledge';
import { prisma } from '@/lib/prisma';
import { RateLimiters } from '@/lib/rate-limit';
import { braveSearch } from '@/lib/research';

export async function POST(req: NextRequest) {
  const rateLimitResponse = await RateLimiters.aiChatbot(req);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const { message, context, pathname, ventureId: bodyVentureId } = await req.json();
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Nachricht fehlt' }, { status: 400 });
    }

    const forgeKnowledge = getForgePromptContext();
    const normalizedMessage = message.trim();
    const researchMatch = normalizedMessage.match(/^\s*(\/research|research:|recherche:)\s*(.*)$/i);
    const wantsResearch = Boolean(researchMatch);
    const researchQuery = wantsResearch ? (researchMatch?.[2] || '').trim() : '';
    const userMessage = wantsResearch ? researchQuery : normalizedMessage;
    if (wantsResearch && !userMessage) {
      return NextResponse.json({ error: 'Bitte gib eine Recherche-Frage an.' }, { status: 400 });
    }

    const ventureId =
      bodyVentureId ||
      (typeof pathname === 'string' ? pathname.match(/^\/forge\/([^/?#]+)/i)?.[1] : null);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, role: true, credits: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const limitText = (value: string, max = 280) =>
      value.length > max ? `${value.slice(0, max).trim()}…` : value;
    const parsePositiveInt = (value: string | undefined, fallback: number) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
    };
    const estimateTokens = (text: string) => Math.max(1, Math.ceil(text.trim().length / 4));

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

    let researchContext = '';
    if (wantsResearch) {
      try {
        const searchResponse = await braveSearch(userMessage, 5);
        if (searchResponse.results.length > 0) {
          const formattedSources = searchResponse.results
            .map((result, index) => {
              const published = result.published ? ` (${result.published})` : '';
              return `[${index + 1}] ${result.title}${published}\n${result.url}\n${result.snippet}`;
            })
            .join('\n\n');
          researchContext = `
LIVE-RECHERCHE (QUELLEN):
${formattedSources}
`.trim();
        } else {
          researchContext = 'LIVE-RECHERCHE: Keine Treffer gefunden.';
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({
          error: 'Live-Recherche ist aktuell nicht verfügbar.',
          code: 'RESEARCH_UNAVAILABLE',
          detail: message
        }, { status: 503 });
      }
    }

    const systemPrompt = `
    Du bist Forge AI, der operative Assistent im "THE FORGE" Venture Studio System.
    
    ${forgeKnowledge}
    
    DEIN AKTUELLER KONTEXT:
    - Der User befindet sich auf der Seite: ${pathname}
    - Der spezifische Kontext ist: "${context}"
    ${ventureContext ? `\n${ventureContext}\n` : ''}
    ${researchContext ? `\n${researchContext}\n` : ''}
    
    DEINE ROLLE:
    - Hilf dem User, Aufgaben in diesem spezifischen Kontext zu erledigen.
    - Beziehe dich bei Bedarf auf die Core Module (z.B. Admin Shield für Verträge, Supply Chain Command für Sourcing).
    - Wenn der User ein Formular ausfüllt, gib hilfreiche Tipps für die Felder.
    - Bevorzuge kostenlose Tools oder Free-Tier Optionen. Nenne Kosten nur, wenn sie relevant sind.
    - Wenn Zahlen/Quellen fehlen oder veraltet sein koennten, markiere Unsicherheit kurz und schlage einen Verifikationsweg vor.
    - Wenn Kontext fehlt, stelle 1 kurze Rueckfrage.
    - Wenn LIVE-RECHERCHE vorhanden ist: nutze sie aktiv, zitiere Quellen als [1], [2] und verlinke die URLs.
    - Antworte immer kurz, prägnant und hilfreich.
    - Nutze Markdown für bessere Lesbarkeit.
    
    ANTWORTE IMMER AUF DEUTSCH.
    `;

    const maxTokens = wantsResearch ? 900 : 1000;
    let maxCostEstimate = 0;
    const creditsPer1k = parsePositiveInt(process.env.AI_CREDITS_PER_1K_TOKENS, 1);
    const researchBaseCredits = parsePositiveInt(process.env.AI_RESEARCH_BASE_CREDITS, 5);
    if (wantsResearch) {
      const promptText = `${systemPrompt}\n\n${userMessage}`;
      const estimatedTokens = estimateTokens(promptText) + maxTokens;
      const tokenCredits = Math.max(1, Math.ceil((estimatedTokens / 1000) * creditsPer1k));
      maxCostEstimate = researchBaseCredits + tokenCredits;
      if ((user.credits || 0) < maxCostEstimate) {
        return NextResponse.json({
          error: 'Nicht genug Energy (Credits). Bitte lade dein Konto auf.',
          code: 'INSUFFICIENT_CREDITS',
          requiredCredits: maxCostEstimate,
          creditsAvailable: user.credits || 0
        }, { status: 402 });
      }
    }

    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], { maxTokens });

    if (response.error) {
       throw new Error(response.error);
    }

    let creditsRemaining: number | undefined;
    let creditsUsed: number | undefined;
    if (wantsResearch) {
      const promptText = `${systemPrompt}\n\n${userMessage}\n\n${response.content}`;
      const actualTokens = estimateTokens(promptText);
      const tokenCredits = Math.max(1, Math.ceil((actualTokens / 1000) * creditsPer1k));
      const totalCredits = researchBaseCredits + tokenCredits;
      creditsUsed = totalCredits;

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: totalCredits } },
        select: { credits: true },
      });
      creditsRemaining = updated.credits;
    }

    return NextResponse.json({
      response: response.content,
      creditsUsed,
      creditsRemaining
    });

  } catch (error) {
    console.error('Contextual chat failed:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
