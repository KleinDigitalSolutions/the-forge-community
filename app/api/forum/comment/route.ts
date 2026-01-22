import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

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
      select: { id: true }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (parentId) {
      const parent = await prisma.forumComment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true }
      });

      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 });
      }
    }

    const comment = await prisma.forumComment.create({
      data: {
        postId,
        parentId: parentId || null,
        authorId: user.id,
        authorName: user.name || 'Anonymous Founder',
        content
      }
    });

    return NextResponse.json({
      id: comment.id,
      authorId: comment.authorId,
      parentId: comment.parentId,
      author: comment.authorName,
      authorImage: user.image || null,
      authorSlug: user.profileSlug || null,
      founderNumber: user.founderNumber || 0,
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
