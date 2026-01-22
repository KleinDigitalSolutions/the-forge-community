import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { assignFounderNumberIfMissing } from '@/lib/founder-number';
import { ensureProfileSlug } from '@/lib/profile';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { postId, content, parentId } = body;

    if (!postId || !content) {
      return NextResponse.json({ error: 'Missing postId or content' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, image: true, profileSlug: true, founderNumber: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let parentAuthorId: string | null = null;
    if (parentId) {
      const parent = await prisma.forumComment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true, authorId: true }
      });

      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
      }

      parentAuthorId = parent.authorId || null;
    }

    const founderNumber = await assignFounderNumberIfMissing(user.id);
    const profileSlug = await ensureProfileSlug({
      id: user.id,
      name: user.name,
      founderNumber,
      profileSlug: user.profileSlug,
    });

    const comment = await prisma.forumComment.create({
      data: {
        postId,
        parentId: parentId || null,
        authorId: user.id,
        authorName: user.name || 'Anonymous Founder',
        content
      }
    });

    const actorName = user.name || 'Ein Founder';
    const recipients = new Map<string, { type: 'FORUM_COMMENT' | 'FORUM_REPLY'; title: string; message: string }>();

    if (parentId && parentAuthorId && parentAuthorId !== user.id) {
      recipients.set(parentAuthorId, {
        type: 'FORUM_REPLY',
        title: 'Antwort auf deinen Kommentar',
        message: `${actorName} hat auf deinen Kommentar geantwortet.`,
      });
    }

    if (post.authorId && post.authorId !== user.id) {
      if (!recipients.has(post.authorId)) {
        recipients.set(post.authorId, {
          type: 'FORUM_COMMENT',
          title: 'Neuer Kommentar',
          message: `${actorName} hat deinen Beitrag kommentiert.`,
        });
      }
    }

    if (recipients.size > 0) {
      try {
        await Promise.all(
          Array.from(recipients.entries()).map(([recipientId, payload]) =>
            prisma.notification.create({
              data: {
                userId: recipientId,
                actorId: user.id,
                type: payload.type,
                title: payload.title,
                message: payload.message,
                href: `/forum#${postId}`,
              },
            })
          )
        );
      } catch (notificationError) {
        console.error('Notification creation failed:', notificationError);
      }
    }

    return NextResponse.json({
      id: comment.id,
      authorId: comment.authorId,
      parentId: comment.parentId,
      author: comment.authorName,
      authorImage: user.image || null,
      authorSlug: profileSlug,
      founderNumber,
      content: comment.content,
      likes: comment.likes,
      userVote: 0,
      time: comment.createdAt.toISOString()
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
