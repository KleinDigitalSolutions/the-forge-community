import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [resources, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        orderBy: { title: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.resource.count({ where })
    ]);

    return NextResponse.json({ resources, total });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources', details: error.message },
      { status: 500 }
    );
  }
}
