import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const courses = await prisma.trainingCourse.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        category: true,
        level: true,
        coverImage: true,
        durationMins: true,
        createdAt: true,
        _count: { select: { modules: true } },
      },
    });

    return NextResponse.json(
      courses.map(({ _count, ...course }) => ({
        ...course,
        modulesCount: _count.modules,
      }))
    );
  } catch (error) {
    console.error('Training list error:', error);
    return NextResponse.json({ error: 'Failed to load training' }, { status: 500 });
  }
}
