import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

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

    // Get squad details
    const squadResult = await sql`
      SELECT
        s.*,
        u.name as lead_name,
        u.email as lead_email
      FROM squads s
      LEFT JOIN "User" u ON s.lead_id = u.id
      WHERE s.id = ${squadId}
      LIMIT 1
    `;

    if (!squadResult.rows.length) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    const squad = squadResult.rows[0];

    // Get members
    const membersResult = await sql`
      SELECT
        sm.*,
        u.name as user_name,
        u.email as user_email
      FROM squad_members sm
      INNER JOIN "User" u ON sm.user_id = u.id
      WHERE sm.squad_id = ${squadId}
      ORDER BY
        CASE sm.role
          WHEN 'lead' THEN 1
          WHEN 'co-founder' THEN 2
          ELSE 3
        END,
        sm.joined_at ASC
    `;

    // Get venture (if exists)
    const ventureResult = await sql`
      SELECT * FROM ventures
      WHERE squad_id = ${squadId}
      LIMIT 1
    `;

    const venture = ventureResult.rows[0] || null;

    // Get venture phases (if venture exists)
    let phases: any[] = [];
    if (venture) {
      const phasesResult = await sql`
        SELECT * FROM venture_phases
        WHERE venture_id = ${venture.id}
        ORDER BY phase_number ASC
      `;
      phases = phasesResult.rows;
    }

    // Get squad wallet
    const walletResult = await sql`
      SELECT * FROM squad_wallets
      WHERE squad_id = ${squadId}
      LIMIT 1
    `;

    const wallet = walletResult.rows[0] || null;

    // Get recent transactions
    const transactionsResult = await sql`
      SELECT
        wt.*,
        u.name as created_by_name
      FROM wallet_transactions wt
      LEFT JOIN "User" u ON wt.created_by = u.id
      WHERE wt.squad_id = ${squadId}
      ORDER BY wt.created_at DESC
      LIMIT 10
    `;

    // Check if current user is a member
    const userResult = await sql`
      SELECT id FROM "User"
      WHERE email = ${session.user.email}
      LIMIT 1
    `;

    const userId = userResult.rows[0]?.id;
    const isMember = membersResult.rows.some(m => m.user_id === userId && m.status === 'active');

    return NextResponse.json({
      squad: {
        ...squad,
        members: membersResult.rows,
        member_count: membersResult.rows.filter(m => m.status === 'active').length,
        is_member: isMember,
        user_role: membersResult.rows.find(m => m.user_id === userId)?.role || null
      },
      venture,
      phases,
      wallet,
      recent_transactions: transactionsResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching squad details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch squad details', details: error.message },
      { status: 500 }
    );
  }
}

// Update squad settings
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

    // Get user
    const userResult = await sql`
      SELECT id FROM "User"
      WHERE email = ${session.user.email}
      LIMIT 1
    `;

    const userId = userResult.rows[0]?.id;

    // Check if user is squad lead
    const squadResult = await sql`
      SELECT * FROM squads
      WHERE id = ${squadId}
        AND lead_id = ${userId}
      LIMIT 1
    `;

    if (!squadResult.rows.length) {
      return NextResponse.json(
        { error: 'Only the squad lead can update squad settings' },
        { status: 403 }
      );
    }

    // Build update query
    const allowedFields = ['name', 'mission', 'is_public', 'is_accepting_members', 'status'];
    const updateFields = Object.keys(updates).filter(k => allowedFields.includes(k));

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Construct SET clause
    const setClauses = updateFields.map((field, i) => `${field} = $${i + 2}`).join(', ');
    const values = [squadId, ...updateFields.map(f => updates[f])];

    const result = await sql.query(
      `UPDATE squads SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );

    return NextResponse.json({
      success: true,
      squad: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error updating squad:', error);
    return NextResponse.json(
      { error: 'Failed to update squad', details: error.message },
      { status: 500 }
    );
  }
}
