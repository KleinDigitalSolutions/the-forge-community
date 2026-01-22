import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const CACHE_TTL_MS = 1000 * 60 * 15;
const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=600',
};

let cachedResult: { data: any; expiresAt: number } | null = null;
let inflight: Promise<any> | null = null;

type NormalizedPost = {
  id: string;
  content: string;
  category: string;
  likes: number;
  comments: number;
  created: Date;
};

/**
 * Analyze trending topics from forum discussions
 * Uses AI to identify patterns and emerging themes
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === '1';
    const now = Date.now();
    if (!forceRefresh && cachedResult && cachedResult.expiresAt > now) {
      return NextResponse.json(cachedResult.data, { headers: cacheHeaders });
    }

    if (inflight) {
      const data = await inflight;
      return NextResponse.json(data, { headers: cacheHeaders });
    }

    inflight = (async () => {
      // Recent posts (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentPosts = await prisma.forumPost.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: {
          id: true,
          content: true,
          category: true,
          likes: true,
          createdAt: true,
          _count: { select: { comments: true } },
        },
      });

      const normalized: NormalizedPost[] = recentPosts.map((post) => ({
        id: post.id,
        content: post.content || '',
        category: post.category || 'General',
        likes: post.likes || 0,
        comments: post._count.comments,
        created: post.createdAt,
      }));

      if (normalized.length === 0) {
        return {
          topics: [],
          message: 'Nicht genug Daten für Trend-Analyse',
        };
      }

      // Prepare data for AI analysis
      const postsData = normalized.map(post => ({
        excerpt: post.content.slice(0, 400),
        category: post.category,
        likes: post.likes,
        comments: post.comments,
        created: post.created.toISOString(),
      }));

      // Use AI to analyze trends
      const analysis = await callAI([
        {
          role: 'system',
          content: `Du bist ein Data Analyst für Community-Trends.

        AUFGABE:
        Analysiere die Forum-Posts und identifiziere die TOP 5 Trending Topics.

        FELDER:
        - excerpt: kurzer Textauszug des Posts
        - category: Kategorie des Posts
        - likes: Anzahl Likes
        - comments: Anzahl Kommentare
        - created: ISO Datum

        KRITERIEN für ein "Trending Topic":
        - Häufigkeit: Wird das Thema in mehreren Posts diskutiert?
        - Engagement: Viele Likes & Comments?
        - Aktualität: Neue/wachsende Diskussion?
        - Relevanz: Wichtig für die Community?

        OUTPUT FORMAT (JSON):
        {
          "topics": [
            {
              "topic": "Kurzer prägnanter Name des Trends",
              "description": "1 Satz Erklärung",
              "heat": 0-100 (Trend-Stärke),
              "posts_count": Anzahl relevanter Posts,
              "category": "Hauptkategorie"
            }
          ]
        }

        REGELN:
        - Maximal 5 Topics
        - Sortiert nach "heat" (höchste zuerst)
        - Nur echte Trends, keine Einzelthemen
        - Deutsche Namen & Beschreibungen
        - Antworte NUR mit JSON, keine Erklärungen`,
        },
        {
          role: 'user',
          content: `Analysiere diese ${recentPosts.length} Forum-Posts:\n\n${JSON.stringify(postsData, null, 2)}`,
        },
      ], {
        temperature: 0.4,
        maxTokens: 1000,
      });

      // Parse AI response
      let topics = [];
      try {
        const parsed = JSON.parse(extractJson(analysis.content || '') || '{}');
        topics = parsed.topics || [];
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        // Fallback: Simple category-based trending
        topics = generateFallbackTrends(normalized);
      }

      return {
        topics,
        analyzed_posts: normalized.length,
        period: '30 days',
        provider: analysis.provider,
        generated_at: new Date().toISOString(),
      };
    })();

    const data = await inflight;
    cachedResult = {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json(data, { headers: cacheHeaders });
  } catch (error: any) {
    console.error('Trending topics error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze trends', details: error.message },
      { status: 500 }
    );
  } finally {
    inflight = null;
  }
}

/**
 * Fallback: Simple category-based trending
 * Used if AI analysis fails
 */
function generateFallbackTrends(posts: NormalizedPost[]) {
  const categoryStats: Record<string, {
    count: number;
    likes: number;
    comments: number;
  }> = {};

  // Aggregate by category
  posts.forEach(post => {
    if (!categoryStats[post.category]) {
      categoryStats[post.category] = { count: 0, likes: 0, comments: 0 };
    }
    categoryStats[post.category].count++;
    categoryStats[post.category].likes += post.likes || 0;
    categoryStats[post.category].comments += post.comments || 0;
  });

  // Calculate heat and convert to topics
  return Object.entries(categoryStats)
    .map(([category, stats]) => {
      const heat = Math.min(
        100,
        (stats.count * 20) + (stats.likes * 5) + (stats.comments * 3)
      );
      return {
        topic: category,
        description: `Aktive Diskussionen in ${category}`,
        heat: Math.round(heat),
        posts_count: stats.count,
        category,
      };
    })
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 5);
}

function extractJson(content: string) {
  const cleaned = content.replace(/```json|```/gi, '').trim();
  if (cleaned.startsWith('{') || cleaned.startsWith('[')) {
    return cleaned;
  }
  const match = cleaned.match(/\{[\s\S]*\}/);
  return match ? match[0] : '';
}
