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
    // 1. Daten aus Notion holen (Status, Founder-Nummer)
    const founder = await getFounderByEmail(session.user.email);
    
    // 2. Daten aus Postgres holen (Dossier: Adresse, BDay, etc.)
    const pgUser = await sql`
      SELECT name, phone, birthday, address_street, address_city, address_zip, address_country, instagram, linkedin, bio, skills, goal
      FROM users 
      WHERE email = ${session.user.email}
    `;

    const profile = pgUser.rows[0] || {};

    // 3. Prüfen, ob das Profil vollständig ist (Pflichtfelder)
    const isComplete = !!(
      profile.name && 
      profile.birthday && 
      profile.address_city && 
      profile.phone
    );

    return NextResponse.json({
      ...founder,
      ...profile,
      isProfileComplete: isComplete
    });
  } catch (error) {
    console.error('Error fetching combined profile:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
