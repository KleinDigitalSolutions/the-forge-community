import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Admin API: Delete User Account
 * Sets accountStatus to DELETED (soft delete)
 */

export async function POST(req: Request) {
  const session = await auth();

  // Admin check
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, accountStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.accountStatus === 'DELETED') {
      return NextResponse.json({ error: 'User already deleted' }, { status: 400 });
    }

    // Soft delete: Set accountStatus to DELETED
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'DELETED',
        deletedAt: new Date(),
        deletedReason: 'Admin deletion',
      },
    });

    console.log(`[ADMIN] User ${user.email} deleted by ${session?.user?.email ?? 'unknown'}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
