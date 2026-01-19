import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFounderByEmail } from '@/lib/notion';
import { sql } from '@vercel/postgres';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // 1. Daten aus Postgres holen (Primary source)
    const pgUser = await sql`
      SELECT
        id, email, name, phone, birthday,
        address_street, address_city, address_zip, address_country,
        instagram, linkedin, bio, skills, goal,
        time_commitment, budget_capacity, experience_level,
        preferred_roles, timezone, languages
      FROM "User"
      WHERE email = ${session.user.email}
      LIMIT 1
    `;

    const profile = pgUser.rows[0];

    if (!profile) {
      // User not in database yet - create minimal record
      await sql`
        INSERT INTO "User" (email, name)
        VALUES (${session.user.email}, ${session.user.name || 'Founder'})
        ON CONFLICT (email) DO NOTHING
      `;

      return NextResponse.json({
        email: session.user.email,
        name: session.user.name || 'Founder',
        isProfileComplete: false
      });
    }

    // 2. Optional: Try to get Notion data (fallback, not critical)
    let notionData = null;
    try {
      notionData = await getFounderByEmail(session.user.email);
    } catch (e) {
      console.warn('Notion lookup failed (non-critical):', e);
    }

    // 3. Check if profile is complete
    const isComplete = !!(
      profile.name &&
      profile.phone &&
      profile.bio &&
      profile.skills?.length > 0
    );

    return NextResponse.json({
      ...profile,
      founderNumber: notionData?.founderNumber || 0,
      status: notionData?.status || 'active',
      isProfileComplete: isComplete
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    );
  }
}
