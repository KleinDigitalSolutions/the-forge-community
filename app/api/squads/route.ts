import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // all, my-squads, open

    let query;

    switch (filter) {
      case 'my-squads':
        // Get squads where user is a member
        query = sql`
          SELECT
            s.*,
            u.name as lead_name,
            u.email as lead_email,
            sm.role as my_role,
            sm.equity_share as my_equity
          FROM squads s
          LEFT JOIN "User" u ON s.lead_id = u.id
          INNER JOIN squad_members sm ON s.id = sm.squad_id
          INNER JOIN "User" me ON sm.user_id = me.id
          WHERE me.email = ${session.user.email}
            AND sm.status = 'active'
            AND s.status != 'archived'
          ORDER BY s.created_at DESC
        `;
        break;

      case 'open':
        // Get public squads accepting members
        query = sql`
          SELECT
            s.*,
            u.name as lead_name,
            u.email as lead_email,
            (s.max_members - s.current_members) as slots_available
          FROM squads s
          LEFT JOIN "User" u ON s.lead_id = u.id
          WHERE s.is_public = true
            AND s.is_accepting_members = true
            AND s.current_members < s.max_members
            AND s.status = 'forming'
          ORDER BY s.created_at DESC
        `;
        break;

      default: // 'all'
        // Get all squads (for admins or browse)
        query = sql`
          SELECT
            s.*,
            u.name as lead_name,
            u.email as lead_email
          FROM squads s
          LEFT JOIN "User" u ON s.lead_id = u.id
          WHERE s.status != 'archived'
          ORDER BY s.created_at DESC
        `;
    }

    const result = await query;

    // For each squad, get member details
    const squads = await Promise.all(
      result.rows.map(async (squad) => {
        // Get members
        const membersResult = await sql`
          SELECT
            sm.*,
            u.name as user_name,
            u.email as user_email
          FROM squad_members sm
          INNER JOIN "User" u ON sm.user_id = u.id
          WHERE sm.squad_id = ${squad.id}
            AND sm.status = 'active'
          ORDER BY sm.joined_at ASC
        `;

        return {
          ...squad,
          members: membersResult.rows,
          member_count: membersResult.rows.length
        };
      })
    );

    return NextResponse.json({
      squads,
      count: squads.length,
      filter
    });

  } catch (error: any) {
    console.error('Error fetching squads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch squads', details: error.message },
      { status: 500 }
    );
  }
}
