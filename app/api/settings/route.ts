import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const DEFAULT_PREFS = {
  forumComments: true,
  forumReplies: true,
  mentions: true,
  system: true
};

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

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: user.id }
  });

  return NextResponse.json({
    notifications: prefs
      ? {
          forumComments: prefs.forumComments,
          forumReplies: prefs.forumReplies,
          mentions: prefs.mentions,
          system: prefs.system
        }
      : DEFAULT_PREFS
  });
}

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => ({}));
  const notifications = body?.notifications || {};

  const nextPrefs = {
    forumComments: typeof notifications.forumComments === 'boolean' ? notifications.forumComments : DEFAULT_PREFS.forumComments,
    forumReplies: typeof notifications.forumReplies === 'boolean' ? notifications.forumReplies : DEFAULT_PREFS.forumReplies,
    mentions: typeof notifications.mentions === 'boolean' ? notifications.mentions : DEFAULT_PREFS.mentions,
    system: typeof notifications.system === 'boolean' ? notifications.system : DEFAULT_PREFS.system
  };

  const updated = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: nextPrefs,
    create: {
      userId: user.id,
      ...nextPrefs
    }
  });

  return NextResponse.json({
    notifications: {
      forumComments: updated.forumComments,
      forumReplies: updated.forumReplies,
      mentions: updated.mentions,
      system: updated.system
    }
  });
}
