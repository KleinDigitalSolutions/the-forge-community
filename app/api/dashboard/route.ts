import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      ventures: {
        orderBy: { updatedAt: 'desc' },
        include: {
          squad: true
        }
      },
      squadMemberships: {
        include: {
          squad: {
            include: {
              _count: {
                select: { members: true }
              }
            }
          }
        }
      },
      _count: {
        select: {
          createdPosts: true,
        }
      }
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Calculate generic stats (in a real app, these would be aggregated from DB)
  // For now, we simulate "Community Stats" or user-specific stats
  const stats = {
    myVentures: user.ventures.length,
    mySquads: user.squadMemberships.length,
    karma: 0, // Implement karma fetching if needed
    forumPosts: user._count.createdPosts
  };

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      image: user.image,
      onboardingComplete: user.onboardingComplete,
      role: user.role
    },
    ventures: user.ventures,
    squads: user.squadMemberships.map(m => m.squad),
    stats
  });
}
