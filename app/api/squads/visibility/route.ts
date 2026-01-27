import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { squad_id, is_public, is_accepting_members } = body;

    if (!squad_id) {
      return NextResponse.json({ error: 'Missing squad_id' }, { status: 400 });
    }

    const hasPublic = typeof is_public === 'boolean';
    const hasAccepting = typeof is_accepting_members === 'boolean';

    if (!hasPublic && !hasAccepting) {
      return NextResponse.json({ error: 'No visibility fields provided' }, { status: 400 });
    }

    const userResult = await sql`
      SELECT id FROM "User"
      WHERE email = ${session.user.email}
      LIMIT 1
    `;

    if (!userResult.rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    const leadCheck = await sql`
      SELECT id FROM squad_members
      WHERE squad_id = ${squad_id}
        AND user_id = ${userId}
        AND role = 'lead'
        AND status = 'active'
      LIMIT 1
    `;

    if (!leadCheck.rows.length) {
      return NextResponse.json({ error: 'Only the squad lead can update visibility' }, { status: 403 });
    }

    const publicValue = hasPublic ? is_public : null;
    const acceptingValue = hasAccepting ? is_accepting_members : null;

    const updateResult = await sql`
      UPDATE squads
      SET
        is_public = COALESCE(${publicValue}, is_public),
        is_accepting_members = COALESCE(${acceptingValue}, is_accepting_members)
      WHERE id = ${squad_id}
      RETURNING id, is_public, is_accepting_members
    `;

    if (!updateResult.rows.length) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, squad: updateResult.rows[0] });
  } catch (error: any) {
    console.error('Error updating squad visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update squad visibility', details: error.message },
      { status: 500 }
    );
  }
}
