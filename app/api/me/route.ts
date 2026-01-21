import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    return NextResponse.json({
      ...user,
      address_street: user.addressStreet,
      address_city: user.addressCity,
      address_zip: user.addressZip,
      address_country: user.addressCountry,
    });
  } catch (error: any) {
    // Fallback für Umgebungen ohne neue Spalten, um 500er zu vermeiden
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.warn('GET /api/me fallback (DB lacks new profile fields):', error.message);
    } else {
      console.error('GET /api/me failed:', error);
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
        _count: {
          select: { ventures: true, squadMemberships: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  }
}
