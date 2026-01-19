import { NextResponse } from 'next/server';
import { getForumPosts } from '@/lib/notion';
import { callAI } from '@/lib/ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Analyze trending topics from forum discussions
 * Uses AI to identify patterns and emerging themes
 */
export async function GET() {
  try {
    // Get recent posts (last 30 days)
    const allPosts = await getForumPosts();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPosts = allPosts.filter(post => {
      const postDate = new Date(post.created_at);
      return postDate >= thirtyDaysAgo;
    });

    if (recentPosts.length === 0) {
      return NextResponse.json({
        topics: [],
        message: 'Nicht genug Daten für Trend-Analyse'
      });
    }

    // Prepare data for AI analysis
    const postsData = recentPosts.map(post => ({
      title: post.title,
      category: post.category,
      upvotes: post.upvotes,
      comments: post.comments,
      created: post.created_at
    }));

    // Use AI to analyze trends
    const analysis = await callAI([
      {
        role: 'system',
        content: `Du bist ein Data Analyst für Community-Trends.

        AUFGABE:
        Analysiere die Forum-Posts und identifiziere die TOP 5 Trending Topics.

        KRITERIEN für ein "Trending Topic":
        - Häufigkeit: Wird das Thema in mehreren Posts diskutiert?
        - Engagement: Viele Upvotes & Comments?
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
        - Antworte NUR mit JSON, keine Erklärungen`
      },
      {
        role: 'user',
        content: `Analysiere diese ${recentPosts.length} Forum-Posts:\n\n${JSON.stringify(postsData, null, 2)}`
      }
    ], {
      temperature: 0.4,
      maxTokens: 1000
    });

    // Parse AI response
    let topics = [];
    try {
      const parsed = JSON.parse(analysis.content);
      topics = parsed.topics || [];
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback: Simple category-based trending
      topics = generateFallbackTrends(recentPosts);
    }

    return NextResponse.json({
      topics,
      analyzed_posts: recentPosts.length,
      period: '30 days',
      provider: analysis.provider,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Trending topics error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze trends', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Fallback: Simple category-based trending
 * Used if AI analysis fails
 */
function generateFallbackTrends(posts: any[]) {
  const categoryStats: Record<string, {
    count: number;
    upvotes: number;
    comments: number;
  }> = {};

  // Aggregate by category
  posts.forEach(post => {
    if (!categoryStats[post.category]) {
      categoryStats[post.category] = { count: 0, upvotes: 0, comments: 0 };
    }
    categoryStats[post.category].count++;
    categoryStats[post.category].upvotes += post.upvotes || 0;
    categoryStats[post.category].comments += post.comments || 0;
  });

  // Calculate heat and convert to topics
  return Object.entries(categoryStats)
    .map(([category, stats]) => {
      const heat = Math.min(
        100,
        (stats.count * 20) + (stats.upvotes * 5) + (stats.comments * 3)
      );
      return {
        topic: category,
        description: `Aktive Diskussionen in ${category}`,
        heat: Math.round(heat),
        posts_count: stats.count,
        category
      };
    })
    .sort((a, b) => b.heat - a.heat)
    .slice(0, 5);
}
