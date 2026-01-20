import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id, itemId } = await params;

  try {
    const data = await req.json();
    const sample = await prisma.sample.update({
      where: { id: itemId, ventureId: id },
      data
    });

    return NextResponse.json(sample);
  } catch (error) {
    return NextResponse.json({ error: 'Update fehlgeschlagen' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, itemId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  const { id, itemId } = await params;

  try {
    await prisma.sample.delete({
      where: { id: itemId, ventureId: id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Löschen fehlgeschlagen' }, { status: 500 });
  }
}
