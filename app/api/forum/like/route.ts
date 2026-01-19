import { NextResponse } from 'next/server';
import { updateForumPostLikes } from '@/lib/notion';
import { auth } from '@/auth';

export async function POST(request: Request) {
  // 🔒 SECURITY: Auth-Check - Nur eingeloggte User dürfen liken
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, delta } = body;

    if (!id || typeof delta !== 'number') {
      return NextResponse.json(
        { error: 'Missing id or delta' },
        { status: 400 }
      );
    }

    // 🔒 SECURITY: Delta limitieren (nur +1 oder -1 erlauben)
    if (delta !== 1 && delta !== -1) {
      return NextResponse.json(
        { error: 'Delta must be +1 or -1' },
        { status: 400 }
      );
    }

    // TODO: Rate Limiting implementieren (pro User max 1x up/down pro Post)
    // Aktuell kann ein User mehrfach voten, aber zumindest nur +1/-1

    const likes = await updateForumPostLikes(id, delta);
    return NextResponse.json({ id, likes });
  } catch (error) {
    console.error('Error updating forum likes:', error);
    return NextResponse.json(
      { error: 'Failed to update forum likes' },
      { status: 500 }
    );
  }
}
