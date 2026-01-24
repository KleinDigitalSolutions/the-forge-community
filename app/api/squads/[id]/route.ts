import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: squadId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch Squad with all needed relations
    const squad = await prisma.squad.findUnique({
      where: { id: squadId },
      include: {
        members: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          },
          orderBy: [
            { role: 'asc' }, // Simplified ordering for now
            { joinedAt: 'asc' }
          ]
        },
        ventures: {
          take: 1
        },
        wallet: {
          include: {
            transactions: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                createdBy: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    if (!squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    // Auto-create Wallet if missing
    let wallet = squad.wallet;
    if (!wallet) {
      wallet = await prisma.squadWallet.create({
        data: { squadId: squad.id },
        include: { transactions: true }
      }) as any;
    }

    const venture = squad.ventures[0] || null;
    let phases: any[] = [];
    if (venture) {
      phases = await prisma.venturePhase.findMany({
        where: { ventureId: venture.id },
        orderBy: { phaseNumber: 'asc' }
      });
    }

    const isMember = squad.members.some(m => m.userId === user.id && !m.leftAt);
    const userMember = squad.members.find(m => m.userId === user.id);

    return NextResponse.json({
      squad: {
        ...squad,
        members: squad.members.map(m => ({
          ...m,
          user_name: m.user.name,
          user_email: m.user.email
        })),
        member_count: squad.members.filter(m => !m.leftAt).length,
        is_member: isMember,
        user_role: userMember?.role || null
      },
      venture,
      phases,
      wallet,
      recent_transactions: wallet?.transactions || []
    });

  } catch (error: any) {
    console.error('Error fetching squad details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch squad details', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: squadId } = await params;
    const updates = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Verify Lead
    const squadMember = await prisma.squadMember.findFirst({
      where: {
        squadId,
        userId: user.id,
        role: 'LEAD'
      }
    });

    if (!squadMember) {
      return NextResponse.json({ error: 'Only the squad lead can update settings' }, { status: 403 });
    }

    const updatedSquad = await prisma.squad.update({
      where: { id: squadId },
      data: {
        name: updates.name,
        mission: updates.mission,
        description: updates.description,
        status: updates.status
      }
    });

    return NextResponse.json({ success: true, squad: updatedSquad });

  } catch (error: any) {
    console.error('Error updating squad:', error);
    return NextResponse.json({ error: 'Failed to update squad' }, { status: 500 });
  }
}