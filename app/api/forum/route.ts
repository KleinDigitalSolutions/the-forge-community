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
            name: true,
            founderNumber: true,
          },
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            authorId: true,
            parentId: true,
            authorName: true,
            author: {
              select: {
                id: true,
                image: true,
                profileSlug: true,
                founderNumber: true,
                name: true,
              },
            },
            content: true,
            likes: true,
            createdAt: true
          }
        }
      }
    });

    const missingAuthorNames = Array.from(
      new Set(
        posts
          .filter(post => !post.authorId && post.authorName && post.authorName !== 'Anonymous Founder')
          .map(post => post.authorName)
      )
    );

    const fallbackUsers = missingAuthorNames.length > 0
      ? await prisma.user.findMany({
          where: {
            OR: missingAuthorNames.map(name => ({
              name: { equals: name, mode: 'insensitive' }
            }))
          },
          select: {
            id: true,
            name: true,
            image: true,
            profileSlug: true,
            founderNumber: true,
          }
        })
      : [];

    const fallbackByName = new Map<string, { image: string | null; profileSlug: string | null; founderNumber: number | null; name: string | null; id: string }>();
    await Promise.all(
      fallbackUsers.map(async user => {
        const slug = user.profileSlug || await ensureProfileSlug({
          id: user.id,
          name: user.name,
          founderNumber: user.founderNumber,
          profileSlug: user.profileSlug,
        });
        const key = user.name?.trim().toLowerCase();
        if (key) {
          fallbackByName.set(key, {
            id: user.id,
            name: user.name,
            image: user.image ?? null,
            profileSlug: slug,
            founderNumber: user.founderNumber ?? null,
          });
        }
      })
    );
    
    // If user is logged in, attach their existing votes
    let userVotes: Map<string, number> = new Map();
    let commentVotes: Map<string, number> = new Map();
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          forumVotes: { select: { postId: true, voteType: true } },
          forumCommentVotes: { select: { commentId: true, voteType: true } }
        }
      });
      userVotes = new Map((user?.forumVotes || []).map(vote => [vote.postId, vote.voteType]));
      commentVotes = new Map((user?.forumCommentVotes || []).map(vote => [vote.commentId, vote.voteType]));
    }

    const authorCandidates = new Map<string, { id: string; name: string | null; founderNumber: number | null; profileSlug: string | null }>();
    posts.forEach(post => {
      if (post.author?.id) {
        authorCandidates.set(post.author.id, {
          id: post.author.id,
          name: post.author.name ?? null,
          founderNumber: post.author.founderNumber ?? null,
          profileSlug: post.author.profileSlug ?? null,
        });
      }
    });

    const slugEntries = await Promise.all(
      Array.from(authorCandidates.values()).map(async author => {
        if (author.profileSlug) return [author.id, author.profileSlug] as const;
        const slug = await ensureProfileSlug({
          id: author.id,
          name: author.name,
          founderNumber: author.founderNumber,
          profileSlug: author.profileSlug,
        });
        return [author.id, slug] as const;
      })
    );
    const slugByAuthorId = new Map(slugEntries);

    const postsWithVotes = posts.map(post => {
      const fallbackAuthor = (!post.authorId && post.authorName)
        ? fallbackByName.get(post.authorName.trim().toLowerCase())
        : null;

      return ({
      id: post.id,
      authorId: post.authorId,
      author: post.authorName,
      authorImage: post.author?.image || fallbackAuthor?.image || null,
      authorSlug: (post.author?.id ? slugByAuthorId.get(post.author.id) : null) || post.author?.profileSlug || fallbackAuthor?.profileSlug || null,
      founderNumber: post.founderNumber || fallbackAuthor?.founderNumber || 0,
      content: post.content,
      category: post.category,
      likes: post.likes,
      createdTime: post.createdAt.toISOString(),
      comments: post.comments.map(comment => ({
        id: comment.id,
        authorId: comment.authorId,
        parentId: comment.parentId,
        author: comment.authorName,
        authorImage: comment.author?.image || null,
        authorSlug: comment.author?.profileSlug || null,
        founderNumber: comment.author?.founderNumber || 0,
        content: comment.content,
        likes: comment.likes,
        time: comment.createdAt.toISOString(),
        userVote: commentVotes.get(comment.id) || 0
      })),
      userVote: userVotes.get(post.id) || 0
    });
    });

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
