import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import { prisma } from '@/lib/prisma';
import { sendDirectMessage } from '@/lib/direct-messages';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { squad_id, identifier } = body;

    if (!squad_id || !identifier) {
      return NextResponse.json({ error: 'Missing squad_id or identifier' }, { status: 400 });
    }

    const normalizedIdentifier = String(identifier).trim();
    if (!normalizedIdentifier) {
      return NextResponse.json({ error: 'Missing squad_id or identifier' }, { status: 400 });
    }

    const leadResult = await sql`
      SELECT id FROM "User"
      WHERE email = ${session.user.email}
      LIMIT 1
    `;

    if (!leadResult.rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const lead = leadResult.rows[0];

    const leadMembership = await sql`
      SELECT id FROM squad_members
      WHERE squad_id = ${squad_id}
        AND user_id = ${lead.id}
        AND role = 'lead'
        AND status = 'active'
      LIMIT 1
    `;

    if (!leadMembership.rows.length) {
      return NextResponse.json({ error: 'Only the squad lead can invite members' }, { status: 403 });
    }

    const invitee = await prisma.user.findFirst({
      where: normalizedIdentifier.includes('@')
        ? { email: normalizedIdentifier, accountStatus: 'ACTIVE' }
        : { id: normalizedIdentifier, accountStatus: 'ACTIVE' },
      select: { id: true, name: true, email: true }
    });

    if (!invitee) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (invitee.id === lead.id) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 });
    }

    const existingMember = await sql`
      SELECT id FROM squad_members
      WHERE squad_id = ${squad_id}
        AND user_id = ${invitee.id}
      LIMIT 1
    `;

    if (existingMember.rows.length) {
      return NextResponse.json({ error: 'User is already in this squad or pending' }, { status: 409 });
    }

    const squadResult = await sql`
      SELECT * FROM squads
      WHERE id = ${squad_id}
      LIMIT 1
    `;

    if (!squadResult.rows.length) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 });
    }

    const squad = squadResult.rows[0];

    if (squad.current_members >= squad.max_members) {
      return NextResponse.json({ error: 'Squad is full' }, { status: 409 });
    }

    const equityShare = 100 / (squad.current_members + 1);

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
        ${invitee.id},
        'member',
        'active',
        ${equityShare},
        'equal',
        ${lead.id}
      )
    `;

    await sql`
      UPDATE squad_members
      SET equity_share = ${equityShare}
      WHERE squad_id = ${squad_id}
        AND status = 'active'
    `;

    const dmContent = [
      `Du wurdest in den Squad "${squad.name}" eingeladen.`,
      `Lead: ${session.user.email}`,
      `Squad Link: /squads/${squad.id}`
    ].join('\n');

    try {
      await sendDirectMessage({
        senderId: lead.id,
        recipientId: invitee.id,
        content: dmContent
      });
    } catch (error) {
      console.error('Failed to send invite DM:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error inviting to squad:', error);
    return NextResponse.json(
      { error: 'Failed to invite user', details: error.message },
      { status: 500 }
    );
  }
}
