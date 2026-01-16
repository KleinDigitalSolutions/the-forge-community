import { NextResponse } from 'next/server';
import { getForumPosts, addForumPost } from '@/lib/notion';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await getForumPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forum posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { author, founderNumber, content, category } = body;

    if (!author || !content || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await addForumPost({
      author,
      founderNumber,
      content,
      category,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding forum post:', error);
    return NextResponse.json(
      { error: 'Failed to add forum post' },
      { status: 500 }
    );
  }
}
