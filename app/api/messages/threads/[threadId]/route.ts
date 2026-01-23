import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const MAX_LIMIT = 100;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId } = await params;
  const url = new URL(request.url);
  const limitParam = url.searchParams.get('limit');
  const beforeParam = url.searchParams.get('before');
  const limit = Math.min(Number(limitParam) || 50, MAX_LIMIT);

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const participant = await prisma.directParticipant.findUnique({
    where: {
      threadId_userId: {
        threadId,
        userId: user.id
      }
    },
    select: { id: true }
  });

  if (!participant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messageFilter = beforeParam
    ? { createdAt: { lt: new Date(beforeParam) } }
    : {};

  const [messages, thread] = await Promise.all([
    prisma.directMessage.findMany({
      where: {
        threadId,
        ...messageFilter
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            profileSlug: true,
            founderNumber: true
          }
        }
      }
    }),
    prisma.directThread.findUnique({
      where: { id: threadId },
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
        }
      }
    })
  ]);

  await prisma.directParticipant.update({
    where: {
      threadId_userId: {
        threadId,
        userId: user.id
      }
    },
    data: { lastReadAt: new Date() }
  });

  return NextResponse.json({
    threadId,
    participants: thread?.participants.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      name: entry.user.name,
      image: entry.user.image,
      profileSlug: entry.user.profileSlug,
      founderNumber: entry.user.founderNumber
    })) || [],
    messages: messages
      .reverse()
      .map((message) => ({
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        senderId: message.senderId,
        sender: message.sender
      }))
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { threadId } = await params;
  const body = await request.json();
  const trimmedContent = typeof body?.content === 'string' ? body.content.trim() : '';

  if (!trimmedContent) {
    return NextResponse.json({ error: 'Message content required' }, { status: 400 });
  }
  if (trimmedContent.length > 2000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const participant = await prisma.directParticipant.findUnique({
    where: {
      threadId_userId: {
        threadId,
        userId: user.id
      }
    },
    select: { id: true }
  });

  if (!participant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { moderateContent, issueWarning, canUserPost, sanitizeToxicContent } = await import('@/lib/moderation');
  const messageCheck = await canUserPost(user.id);
  if (!messageCheck.allowed) {
    return NextResponse.json({
      error: 'Messaging restricted',
      reason: messageCheck.reason
    }, { status: 403 });
  }

  const moderationResult = await moderateContent(trimmedContent);
  let finalContent = trimmedContent;

  if (moderationResult.isToxic && moderationResult.confidence > 0.6) {
    const warningResult = await issueWarning(user.id, trimmedContent, moderationResult);

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

    finalContent = await sanitizeToxicContent(trimmedContent, moderationResult);
  }

  const message = await prisma.directMessage.create({
    data: {
      threadId,
      senderId: user.id,
      content: finalContent
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
          profileSlug: true,
          founderNumber: true
        }
      }
    }
  });

  await prisma.directThread.update({
    where: { id: threadId },
    data: { lastMessageAt: message.createdAt }
  });

  await prisma.directParticipant.update({
    where: {
      threadId_userId: {
        threadId,
        userId: user.id
      }
    },
    data: { lastReadAt: message.createdAt }
  });

  return NextResponse.json({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    senderId: message.senderId,
    sender: message.sender
  });
}
