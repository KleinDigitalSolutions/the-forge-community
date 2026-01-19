import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ForumAIActions } from '@/lib/ai';
import { RateLimiters } from '@/lib/rate-limit';

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
    const { action, postContent, category } = await request.json();

    if (!action || !postContent) {
      return NextResponse.json(
        { error: 'Missing action or postContent' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'summarize':
        result = await ForumAIActions.summarize(postContent);
        break;
      case 'feedback':
        result = await ForumAIActions.feedback(postContent, category || 'General');
        break;
      case 'expand':
        result = await ForumAIActions.expand(postContent);
        break;
      case 'factCheck':
        result = await ForumAIActions.factCheck(postContent);
        break;
      case 'nextSteps':
        result = await ForumAIActions.nextSteps(postContent);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      content: result.content,
      provider: result.provider,
      action
    });
  } catch (error: any) {
    console.error('AI Action error:', error);
    return NextResponse.json(
      { error: 'AI service failed', details: error.message },
      { status: 500 }
    );
  }
}
