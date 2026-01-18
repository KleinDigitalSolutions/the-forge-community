import { NextResponse } from 'next/server';
import { updateForumPost } from '@/lib/notion';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, content } = body;

    if (!id || !content) {
      return NextResponse.json({ error: 'Missing id or content' }, { status: 400 });
    }

    const response = await updateForumPost(id, content);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
