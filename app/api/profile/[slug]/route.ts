import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ensureProfileSlug } from '@/lib/profile';
import { getProfileAchievements } from '@/lib/achievements';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  const viewer = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ profileSlug: slug }, { id: slug }],
    },
    select: {
      id: true,
      name: true,
      profileSlug: true,
      image: true,
      role: true,
      founderNumber: true,
      bio: true,
      goal: true,
      skills: true,
      instagram: true,
      linkedin: true,
      createdAt: true,
      ventures: {
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
      _count: {
        select: {
          ventures: true,
          squadMemberships: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const profileSlug = await ensureProfileSlug(user);
  const achievements = await getProfileAchievements(user.id);

  const [forumPosts, forumLikes] = await prisma.$transaction([
    prisma.forumPost.count({ where: { authorId: user.id } }),
    prisma.forumPost.aggregate({
      where: { authorId: user.id },
      _sum: { likes: true },
    }),
  ]);

  const [followersCount, followingCount] = await prisma.$transaction([
    prisma.userFollow.count({ where: { followingId: user.id } }),
    prisma.userFollow.count({ where: { followerId: user.id } }),
  ]);

  let isFollowing = false;
  if (viewer?.id && viewer.id !== user.id) {
    const followRecord = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewer.id,
          followingId: user.id,
        },
      },
      select: { id: true },
    });
    isFollowing = Boolean(followRecord);
  }

  return NextResponse.json({
    ...user,
    profileSlug,
    viewerId: viewer?.id ?? null,
    followersCount,
    followingCount,
    isFollowing,
    achievements,
    stats: {
      ventures: user._count.ventures,
      squads: user._count.squadMemberships,
      forumPosts,
      forumLikes: forumLikes._sum.likes ?? 0,
    },
  });
}
