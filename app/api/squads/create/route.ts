import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import type { CreateSquadRequest } from '@/types/database';

export async function POST(request: Request) {
  // Auth check
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: CreateSquadRequest = await request.json();
    const { name, mission, squad_type = 'venture', is_public = true, max_members = 5 } = body;

    // Validation
    if (!name || name.length < 3) {
      return NextResponse.json(
        { error: 'Squad name must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Get user ID from User table
    const userResult = await sql`
      SELECT id FROM "User"
      WHERE email = ${session.user.email}
      LIMIT 1
    `;

    if (!userResult.rows.length) {
      return NextResponse.json(
        { error: 'User not found. Please complete your profile first.' },
        { status: 404 }
      );
    }

    const userId = userResult.rows[0].id;

    // Create Squad
    const squadResult = await sql`
      INSERT INTO squads (
        name,
        mission,
        squad_type,
        is_public,
        max_members,
        lead_id,
        status
      )
      VALUES (
        ${name},
        ${mission || null},
        ${squad_type},
        ${is_public},
        ${max_members},
        ${userId},
        'forming'
      )
      RETURNING *
    `;

    const squad = squadResult.rows[0];

    // Add creator as first member (lead)
    await sql`
      INSERT INTO squad_members (
        squad_id,
        user_id,
        role,
        status,
        equity_share,
        equity_type
      )
      VALUES (
        ${squad.id},
        ${userId},
        'lead',
        'active',
        ${100 / max_members}, -- Equal split by default
        'equal'
      )
    `;

    // Triggers will auto-create:
    // - Squad Wallet
    // - Squad Forum
    // - Update current_members count

    console.log(`✅ Squad created: ${squad.name} (${squad.id}) by ${session.user.email}`);

    return NextResponse.json({
      success: true,
      squad: {
        id: squad.id,
        name: squad.name,
        mission: squad.mission,
        status: squad.status,
        squad_type: squad.squad_type,
        is_public: squad.is_public,
        max_members: squad.max_members,
        current_members: 1,
        lead_id: userId,
        created_at: squad.created_at
      }
    });

  } catch (error: any) {
    console.error('Error creating squad:', error);

    // Handle duplicate squad name
    if (error.message?.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'A squad with this name already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create squad', details: error.message },
      { status: 500 }
    );
  }
}
