import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      onboardingComplete,
      phone,
      birthday,
      address_street,
      address_city,
      address_zip,
      address_country,
      instagram,
      linkedin,
      bio,
      goal,
      skills,
    } = body;

    const data: any = {};
    if (typeof name === 'string') data.name = name.trim();
    if (typeof onboardingComplete === 'boolean') data.onboardingComplete = onboardingComplete;
    if (typeof phone === 'string') data.phone = phone.trim();
    if (typeof birthday === 'string') data.birthday = birthday;
    if (typeof address_street === 'string') data.addressStreet = address_street.trim();
    if (typeof address_city === 'string') data.addressCity = address_city.trim();
    if (typeof address_zip === 'string') data.addressZip = address_zip.trim();
    if (typeof address_country === 'string') data.addressCountry = address_country.trim();
    if (typeof instagram === 'string') data.instagram = instagram.trim();
    if (typeof linkedin === 'string') data.linkedin = linkedin.trim();
    if (typeof bio === 'string') data.bio = bio;
    if (typeof goal === 'string') data.goal = goal;
    if (Array.isArray(skills)) data.skills = skills.filter((s: any) => typeof s === 'string');

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update profile failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
