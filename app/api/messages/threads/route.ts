import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function buildThreadKey(userId: string, recipientId: string) {
  return [userId, recipientId].sort().join(':');
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const participants = await prisma.directParticipant.findMany({
    where: { userId: user.id },
    include: {
      thread: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  profileSlug: true,
                  founderNumber: true
                }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              createdAt: true,
              senderId: true
            }
          }
        }
      }
    },
    orderBy: {
      thread: {
        lastMessageAt: 'desc'
      }
    }
  });

  const threads = participants.map((participant) => {
    const thread = participant.thread;
    return {
      id: thread.id,
      lastMessageAt: thread.lastMessageAt,
      lastReadAt: participant.lastReadAt,
      participants: thread.participants.map((entry) => ({
        id: entry.id,
        userId: entry.userId,
        name: entry.user.name,
        image: entry.user.image,
        profileSlug: entry.user.profileSlug,
        founderNumber: entry.user.founderNumber
      })),
      lastMessage: thread.messages[0] ?? null
    };
  });

  return NextResponse.json({ threads, viewerId: user.id });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { recipientId, recipientSlug } = body || {};

  if (!recipientId && !recipientSlug) {
    return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const recipient = await prisma.user.findFirst({
    where: recipientId
      ? { id: recipientId }
      : { profileSlug: recipientSlug },
    select: { id: true }
  });

  if (!recipient) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  if (recipient.id === user.id) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
  }

  const key = buildThreadKey(user.id, recipient.id);

  let thread = await prisma.directThread.findUnique({
    where: { key },
    select: { id: true }
  });

  if (!thread) {
    try {
      thread = await prisma.directThread.create({
        data: {
          key,
          participants: {
            create: [
              { userId: user.id },
              { userId: recipient.id }
            ]
          }
        },
        select: { id: true }
      });
    } catch (error) {
      thread = await prisma.directThread.findUnique({
        where: { key },
        select: { id: true }
      });

      if (!thread) {
        console.error('Failed to create thread', error);
        return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ threadId: thread.id });
}
