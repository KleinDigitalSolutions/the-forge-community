import { NextResponse } from 'next/server';
import { addForumComment, getFounderByEmail } from '@/lib/notion';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let authorName = session.user.name || 'Anonymous Founder';

    try {
      const founder = await getFounderByEmail(session.user.email);
      if (founder) {
        authorName = founder.name;
      }
    } catch (e) {
      console.warn('API: Founder lookup failed for comment, using fallback');
    }

    const body = await request.json();
    const { postId, content } = body;

    if (!postId || !content) {
      return NextResponse.json({ error: 'Missing postId or content' }, { status: 400 });
    }

    const response = await addForumComment(postId, authorName, content);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    );
  }
}
