import { NextResponse } from 'next/server';
import { getForumPosts, addForumPost, getFounderByEmail } from '@/lib/notion';
import { auth } from '@/auth';
import { Client } from '@notionhq/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const posts = await getForumPosts();
    return NextResponse.json(posts);
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
    let authorName = session.user.name || 'Anonymous Founder';
    let founderNumber = 0;

    try {
      const founder = await getFounderByEmail(session.user.email);
      if (founder) {
        authorName = founder.name;
        founderNumber = founder.founderNumber;
      }
    } catch (e) {
      console.warn('API: Founder lookup failed, using session defaults');
    }

    const body = await request.json();
    const { content, category } = body;

    if (!content || !category) {
      return NextResponse.json({ error: 'Missing content or category' }, { status: 400 });
    }

    // AI MODERATION CHECK
    const { moderateContent, issueWarning, canUserPost } = await import('@/lib/moderation');
    const { prisma } = await import('@/lib/prisma');

    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
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
    const response = await addForumPost({
      author: authorName,
      founderNumber: founderNumber,
      content,
      category,
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
          const notion = new Client({ auth: process.env.NOTION_API_KEY });
          await notion.blocks.children.append({
            block_id: response.id,
            children: [
              { object: 'block', type: 'divider', divider: {} },
              {
                object: 'block',
                type: 'callout',
                callout: {
                  icon: { emoji: '🤖' },
                  color: 'blue_background',
                  rich_text: [{
                    type: 'text',
                    text: { content: `**@forge-ai antwortet:**\n\n${aiResponse.content}\n\n_Powered by ${aiResponse.provider === 'gemini' ? 'Gemini Flash' : 'Groq'}_` }
                  }]
                }
              }
            ]
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