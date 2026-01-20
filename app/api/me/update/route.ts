import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, onboardingComplete } = body;

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(name && { name }),
        ...(typeof onboardingComplete === 'boolean' && { onboardingComplete })
      }
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update profile failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}