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
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      credits: true,
      onboardingComplete: true,
      founderNumber: true,
      karmaScore: true,
      phone: true,
      birthday: true,
      addressStreet: true,
      addressCity: true,
      addressZip: true,
      addressCountry: true,
      instagram: true,
      linkedin: true,
      bio: true,
      goal: true,
      skills: true,
      _count: {
        select: {
          ventures: true,
          squadMemberships: true
        }
      }
    }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Map to frontend keys (snake_case)
  return NextResponse.json({
    ...user,
    address_street: user.addressStreet,
    address_city: user.addressCity,
    address_zip: user.addressZip,
    address_country: user.addressCountry,
  });
}
