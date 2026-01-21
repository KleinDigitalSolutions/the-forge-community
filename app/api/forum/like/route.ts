import { NextResponse } from 'next/server';
import { updateForumPostLikes } from '@/lib/notion';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id: postId, delta } = body; // delta is 1 or -1

    if (!postId || typeof delta !== 'number' || Math.abs(delta) !== 1) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 1. Check for existing vote
    const existingVote = await prisma.forumVote.findUnique({
      where: {
        postId_userId: { postId, userId: user.id }
      }
    });

    let notionDelta = 0;

    if (existingVote) {
      if (existingVote.voteType === delta) {
        // User clicked the SAME arrow again -> Undo vote
        await prisma.forumVote.delete({
          where: { id: existingVote.id }
        });
        notionDelta = -delta; // If it was +1, now -1 to go back to 0
      } else {
        // User changed vote from Up to Down or vice versa
        await prisma.forumVote.update({
          where: { id: existingVote.id },
          data: { voteType: delta }
        });
        notionDelta = delta * 2; // e.g. from -1 to +1 is +2
      }
    } else {
      // New vote
      await prisma.forumVote.create({
        data: {
          postId,
          userId: user.id,
          voteType: delta
        }
      });
      notionDelta = delta;
    }

    // 2. Sync with Notion (Primary Counter)
    const likes = await updateForumPostLikes(postId, notionDelta);
    
    return NextResponse.json({ 
      id: postId, 
      likes, 
      userVote: notionDelta === -delta ? 0 : delta 
    });

  } catch (error) {
    console.error('Error updating forum likes:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
