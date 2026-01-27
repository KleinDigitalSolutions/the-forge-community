import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { sendDirectMessage } from '@/lib/direct-messages';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { squad_id, message } = body;

    if (!squad_id) {
      return NextResponse.json({ error: 'Missing squad_id' }, { status: 400 });
    }

    // Get user
    const userResult = await sql`
      SELECT id, name FROM "User"
      WHERE email = ${session.user.email}
      LIMIT 1
    `;

    if (!userResult.rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Check if squad exists and is accepting members
    const squadResult = await sql`
      SELECT * FROM squads
      WHERE id = ${squad_id}
        AND status IN ('forming', 'building')
        AND is_public = true
        AND is_accepting_members = true
        AND current_members < max_members
      LIMIT 1
    `;

    if (!squadResult.rows.length) {
      return NextResponse.json(
        { error: 'Squad not found or not accepting members' },
        { status: 404 }
      );
    }

    const squad = squadResult.rows[0];

    // Check if user is already a member
    const existingMember = await sql`
      SELECT * FROM squad_members
      WHERE squad_id = ${squad_id}
        AND user_id = ${user.id}
      LIMIT 1
    `;

    if (existingMember.rows.length) {
      const status = existingMember.rows[0].status;

      if (status === 'active') {
        return NextResponse.json(
          { error: 'You are already a member of this squad' },
          { status: 409 }
        );
      } else if (status === 'invited') {
        return NextResponse.json(
          { error: 'Du hast bereits eine offene Bewerbung für dieses Squad' },
          { status: 409 }
        );
      }
    }

    // Calculate equity share (equal split among all members)
    const equityShare = 100 / (squad.current_members + 1);

    // Add user as member with 'invited' status (pending approval)
    const memberStatus = 'invited';

    await sql`
      INSERT INTO squad_members (
        squad_id,
        user_id,
        role,
        status,
        equity_share,
        equity_type,
        invited_by
      )
      VALUES (
        ${squad_id},
        ${user.id},
        'member',
        ${memberStatus},
        ${equityShare},
        'equal',
        ${squad.lead_id}
      )
    `;

    // Trigger will auto-update current_members count

    const note = typeof message === 'string' ? message.trim() : '';
    const dmContent = [
      `Neue Bewerbung für Squad: ${squad.name}`,
      `Bewerber: ${user.name || session.user.email}`,
      note ? `Nachricht: ${note}` : null,
      `Squad Link: /squads/${squad.id}`
    ].filter(Boolean).join('\n');

    try {
      await sendDirectMessage({
        senderId: user.id,
        recipientId: squad.lead_id,
        content: dmContent
      });
    } catch (error) {
      console.error('Failed to send application DM:', error);
    }

    console.log(`✅ User ${user.name} applied to squad ${squad.name} (${memberStatus})`);

    return NextResponse.json({
      success: true,
      status: memberStatus,
      message: `Deine Bewerbung für ${squad.name} wurde an den Squad Lead gesendet.`,
      squad: {
        id: squad.id,
        name: squad.name,
        mission: squad.mission
      }
    });

  } catch (error: any) {
    console.error('Error joining squad:', error);
    return NextResponse.json(
      { error: 'Failed to join squad', details: error.message },
      { status: 500 }
    );
  }
}
