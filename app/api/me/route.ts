import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFounderByEmail } from '@/lib/notion';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const founder = await getFounderByEmail(session.user.email);
  if (!founder) {
    return new NextResponse('Founder not found', { status: 404 });
  }

  return NextResponse.json(founder);
}
