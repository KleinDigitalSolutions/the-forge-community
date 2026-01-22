import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureProfileSlug } from '@/lib/profile';
import { assignFounderNumberIfMissing } from '@/lib/founder-number';
import { syncUserAchievements } from '@/lib/achievements';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await auth();
  
  try {
    const posts = await prisma.forumPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            image: true,
            profileSlug: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            authorId: true,
            authorName: true,
            content: true,
            createdAt: true
          }
        }
      }
    });
    
    // If user is logged in, attach their existing votes
    let userVotes: Map<string, number> = new Map();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { forumVotes: { select: { postId: true, voteType: true } } }
      });
      userVotes = new Map((user?.forumVotes || []).map(vote => [vote.postId, vote.voteType]));
    }

    const postsWithVotes = posts.map(post => ({
      id: post.id,
      authorId: post.authorId,
      author: post.authorName,
      authorImage: post.author?.image || null,
      authorSlug: post.author?.profileSlug || null,
      founderNumber: post.founderNumber,
      content: post.content,
      category: post.category,
      likes: post.likes,
      createdTime: post.createdAt.toISOString(),
      comments: post.comments.map(comment => ({
        id: comment.id,
        authorId: comment.authorId,
        author: comment.authorName,
        content: comment.content,
        time: comment.createdAt.toISOString()
      })),
      userVote: userVotes.get(post.id) || 0
    }));

    return NextResponse.json(postsWithVotes);
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, category } = body;

    if (!content || !category) {
      return NextResponse.json({ error: 'Missing content or category' }, { status: 400 });
    }

    // AI MODERATION CHECK
    const { moderateContent, issueWarning, canUserPost, sanitizeToxicContent } = await import('@/lib/moderation');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, founderNumber: true, profileSlug: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is allowed to post
    const postCheck = await canUserPost(user.id);
    if (!postCheck.allowed) {
      return NextResponse.json({
        error: 'Posting restricted',
        reason: postCheck.reason
      }, { status: 403 });
    }

    // Run toxicity check
    const moderationResult = await moderateContent(content);
    let finalContent = content;

    if (moderationResult.isToxic && moderationResult.confidence > 0.6) {
      const warningResult = await issueWarning(user.id, content, moderationResult);

      if (warningResult.shouldBan) {
        return NextResponse.json({
          error: 'Content violates community guidelines',
          warning: {
            number: warningResult.warningNumber,
            message: warningResult.message,
            banned: warningResult.shouldBan
          }
        }, { status: 400 });
      }

      const canSanitize =
        moderationResult.confidence >= 0.7 &&
        moderationResult.severity === 'MEDIUM' &&
        ['HARASSMENT', 'HATE_SPEECH'].includes(moderationResult.category || '');

      if (!canSanitize) {
        return NextResponse.json({
          error: 'Content violates community guidelines',
          warning: {
            number: warningResult.warningNumber,
            message: warningResult.message,
            banned: warningResult.shouldBan
          }
        }, { status: 400 });
      }

      finalContent = await sanitizeToxicContent(content, moderationResult);
    }

    const founderNumber = await assignFounderNumberIfMissing(user.id);
    await ensureProfileSlug({
      id: user.id,
      name: user.name,
      founderNumber,
      profileSlug: user.profileSlug,
    });

    // Erstelle den Post
    const response = await prisma.forumPost.create({
      data: {
        authorId: user.id,
        authorName: user.name || 'Anonymous Founder',
        founderNumber,
        content: finalContent,
        category
      }
    });
    
    // Check for @forge-ai mention
    const mentionRegex = /@forge-ai\s+(.+)/i;
    const mentionMatch = finalContent.match(mentionRegex);

    if (mentionMatch) {
      // User mentioned AI - respond directly
      try {
        const { ForumAIActions } = await import('@/lib/ai');
        const question = mentionMatch[1];
        const aiResponse = await ForumAIActions.mentionReply(question, `Category: ${category}`);

        if (aiResponse.content && response.id) {
          await prisma.forumComment.create({
            data: {
              postId: response.id,
              authorName: '@forge-ai',
              content: `**@forge-ai antwortet:**\n\n${aiResponse.content}\n\n_Powered by ${aiResponse.provider === 'gemini' ? 'Gemini Flash' : 'Groq'}_`
            }
          });
        }
      } catch (aiError) {
        console.error('AI Mention Reply failed:', aiError);
      }
    }

    await syncUserAchievements(user.id);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error adding forum post:', error);
    return NextResponse.json(
      { error: 'Failed to add forum post', details: error.message },
      { status: 500 }
    );
  }
}
