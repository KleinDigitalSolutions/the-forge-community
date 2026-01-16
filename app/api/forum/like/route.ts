import { NextResponse } from 'next/server';
import { updateForumPostLikes } from '@/lib/notion';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, delta } = body;

    if (!id || typeof delta !== 'number') {
      return NextResponse.json(
        { error: 'Missing id or delta' },
        { status: 400 }
      );
    }

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
