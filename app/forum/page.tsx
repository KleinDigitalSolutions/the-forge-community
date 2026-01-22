import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ForumClient from './ForumClient';
import type { ForumPost, UserProfile } from './ForumClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getInitialUser(email: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      credits: true,
      founderNumber: true,
      karmaScore: true,
      _count: {
        select: {
          ventures: true,
          squadMemberships: true,
        },
      },
    },
  });

  return user || null;
}

async function getInitialPosts(email: string | null): Promise<ForumPost[]> {
  const posts = await prisma.forumPost.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          image: true,
          profileSlug: true,
        },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          authorName: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  let userVotes: Map<string, number> = new Map();
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { forumVotes: { select: { postId: true, voteType: true } } },
    });
    userVotes = new Map((user?.forumVotes || []).map(vote => [vote.postId, vote.voteType]));
  }

  return posts.map(post => ({
    id: post.id,
    authorId: post.authorId,
    author: post.authorName,
    authorImage: post.author?.image || null,
    authorSlug: post.author?.profileSlug || null,
    founderNumber: post.founderNumber,
    content: post.content,
    category: post.category,
    likes: post.likes,
    createdTime: post.createdAt.toISOString(),
    comments: post.comments.map(comment => ({
      author: comment.authorName,
      content: comment.content,
      time: comment.createdAt.toISOString(),
    })),
    userVote: userVotes.get(post.id) || 0,
  }));
}

export default async function ForumPage() {
  const session = await auth();
  const email = session?.user?.email || null;

  const [initialPosts, initialUser] = await Promise.all([
    getInitialPosts(email),
    email ? getInitialUser(email) : Promise.resolve(null),
  ]);

  return <ForumClient initialPosts={initialPosts} initialUser={initialUser} />;
}
