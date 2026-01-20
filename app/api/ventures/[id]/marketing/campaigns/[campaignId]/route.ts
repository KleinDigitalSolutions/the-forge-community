import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, campaignId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id, campaignId } = await params;

  try {
    const campaign = await prisma.marketingCampaign.findUnique({
      where: { id: campaignId, ventureId: id },
      include: {
        posts: {
          orderBy: { scheduledFor: 'asc' }
        },
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!campaign) return NextResponse.json({ error: 'Kampagne nicht gefunden' }, { status: 404 });

    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, campaignId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id, campaignId } = await params;

  try {
    const data = await req.json();
    
    // Date conversion if present
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    if (data.budgetAmount) data.budgetAmount = parseFloat(data.budgetAmount);

    const campaign = await prisma.marketingCampaign.update({
      where: { id: campaignId, ventureId: id },
      data
    });

    return NextResponse.json(campaign);
  } catch (error) {
    return NextResponse.json({ error: 'Update fehlgeschlagen' }, { status: 500 });
  }
}
