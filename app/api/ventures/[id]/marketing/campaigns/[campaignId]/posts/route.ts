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
    const posts = await prisma.contentPost.findMany({
      where: { campaignId, ventureId: id },
      orderBy: { scheduledFor: 'asc' }
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Laden der Posts' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, campaignId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id, campaignId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });

    const data = await req.json();

    const post = await prisma.contentPost.create({
      data: {
        ...data,
        ventureId: id,
        campaignId,
        createdById: user.id,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
      }
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error('Failed to create post:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
