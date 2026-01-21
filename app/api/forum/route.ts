import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const session = await auth();
  
  try {
    const posts = await prisma.forumPost.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
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
      author: post.authorName,
      founderNumber: post.founderNumber,
      content: post.content,
      category: post.category,
      likes: post.likes,
      createdTime: post.createdAt.toISOString(),
      comments: post.comments.map(comment => ({
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
    const { moderateContent, issueWarning, canUserPost } = await import('@/lib/moderation');
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, founderNumber: true }
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

    if (moderationResult.isToxic && moderationResult.confidence > 0.6) {
      // Issue warning
      const warningResult = await issueWarning(user.id, content, moderationResult);

      // Don't create the post - reject it
      return NextResponse.json({
        error: 'Content violates community guidelines',
        warning: {
          number: warningResult.warningNumber,
          message: warningResult.message,
          banned: warningResult.shouldBan
        }
      }, { status: 400 });
    }

    // Erstelle den Post
    const response = await prisma.forumPost.create({
      data: {
        authorId: user.id,
        authorName: user.name || 'Anonymous Founder',
        founderNumber: user.founderNumber || 0,
        content,
        category
      }
    });
    
    // Check for @forge-ai mention
    const mentionRegex = /@forge-ai\s+(.+)/i;
    const mentionMatch = content.match(mentionRegex);

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

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error adding forum post:', error);
    return NextResponse.json(
      { error: 'Failed to add forum post', details: error.message },
      { status: 500 }
    );
  }
}
