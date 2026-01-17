import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getGroups } from '@/lib/notion';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const groups = await getGroups();
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching squads:', error);
    return NextResponse.json([], { status: 500 });
  }
}
