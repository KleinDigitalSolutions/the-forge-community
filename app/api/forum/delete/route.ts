import { NextResponse } from 'next/server';
import { deleteForumPost, getForumPosts, getFounderByEmail } from '@/lib/notion';
import { auth } from '@/auth';

export async function POST(request: Request) {
  // 🔒 SECURITY: Auth-Check
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // 🔒 SECURITY: Owner-Check - Nur eigene Posts dürfen gelöscht werden
    const posts = await getForumPosts();
    const post = posts.find(p => p.id === id);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Prüfe ob der eingeloggte User der Autor ist
    const founder = await getFounderByEmail(session.user.email);
    if (!founder || post.author !== founder.name) {
      return NextResponse.json({
        error: 'Forbidden: You can only delete your own posts'
      }, { status: 403 });
    }

    // User ist authentifiziert UND der Autor -> Löschen erlaubt
    await deleteForumPost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}
