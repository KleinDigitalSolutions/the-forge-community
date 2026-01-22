import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ForumAIActions } from '@/lib/ai';
import { RateLimiters } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export const maxDuration = 30;

export async function POST(request: Request) {
  // SECURITY: Rate limit
  const rateLimitResponse = await RateLimiters.aiChatbot(request);
  if (rateLimitResponse) return rateLimitResponse;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, postContent, category, postId } = await request.json();

    if (!action || !postId) {
      return NextResponse.json(
        { error: 'Missing action or postId' },
        { status: 400 }
      );
    }

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { content: true, category: true },
    });

    const resolvedContent = post?.content || postContent;
    const resolvedCategory = post?.category || category || 'General';

    if (!resolvedContent) {
      return NextResponse.json({ error: 'Post content not found' }, { status: 404 });
    }

    let result;

    switch (action) {
      case 'summarize':
        result = await ForumAIActions.summarize(resolvedContent);
        break;
      case 'feedback':
        result = await ForumAIActions.feedback(resolvedContent, resolvedCategory);
        break;
      case 'expand':
        result = await ForumAIActions.expand(resolvedContent);
        break;
      case 'factCheck':
        result = await ForumAIActions.factCheck(resolvedContent);
        break;
      case 'nextSteps':
        result = await ForumAIActions.nextSteps(resolvedContent);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const actionLabels: Record<string, string> = {
      summarize: 'Kurzfassung',
      feedback: 'Feedback',
      expand: 'Weiter ausführen',
      factCheck: 'Faktencheck',
      nextSteps: 'Nächste Schritte',
    };

    const label = actionLabels[action] || 'Orion Insight';
    const aiContent = `**Orion Insight · ${label}**\n\n${result.content}`;

    const comment = await prisma.forumComment.create({
      data: {
        postId,
        authorName: '@orion',
        content: aiContent,
      },
    });

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      action,
      comment: {
        id: comment.id,
        authorId: comment.authorId,
        parentId: comment.parentId,
        author: comment.authorName,
        content: comment.content,
        likes: comment.likes,
        userVote: 0,
        time: comment.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('AI Action error:', error);
    return NextResponse.json(
      { error: 'AI service failed', details: error.message },
      { status: 500 }
    );
  }
}
