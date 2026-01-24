import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { assignFounderNumberIfMissing } from '@/lib/founder-number';
import { FORUM_VENTURE_DESCRIPTION, FORUM_VENTURE_NAME } from '@/lib/forum-venture';
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
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) return null;

  const founderNumber = await assignFounderNumberIfMissing(user.id);
  return { ...user, founderNumber };
}

async function getOrCreateForumVentureId(email: string | null): Promise<string | null> {
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });
  if (!user) return null;

  const existing = await prisma.venture.findFirst({
    where: {
      ownerId: user.id,
      description: FORUM_VENTURE_DESCRIPTION
    },
    select: { id: true }
  });

  if (existing) return existing.id;

  const created = await prisma.venture.create({
    data: {
      ownerId: user.id,
      name: FORUM_VENTURE_NAME,
      description: FORUM_VENTURE_DESCRIPTION,
      type: 'OTHER',
      status: 'PAUSED',
      currentPhase: 1
    },
    select: { id: true }
  });

  return created.id;
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
          name: true,
          founderNumber: true,
        },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          authorId: true,
          parentId: true,
          authorName: true,
          author: {
            select: {
              id: true,
              image: true,
              profileSlug: true,
              founderNumber: true,
              name: true,
            },
          },
          content: true,
          likes: true,
          createdAt: true,
        },
      },
    },
  });

  let userVotes: Map<string, number> = new Map();
  let commentVotes: Map<string, number> = new Map();
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        forumVotes: { select: { postId: true, voteType: true } },
        forumCommentVotes: { select: { commentId: true, voteType: true } },
      },
    });
    userVotes = new Map((user?.forumVotes || []).map(vote => [vote.postId, vote.voteType]));
    commentVotes = new Map((user?.forumCommentVotes || []).map(vote => [vote.commentId, vote.voteType]));
  }

  return posts.map(post => {
    return ({
    id: post.id,
    authorId: post.authorId,
    author: post.author?.name || post.authorName,
    authorImage: post.author?.image || null,
    authorSlug: post.author?.profileSlug || null,
    founderNumber: post.author?.founderNumber ?? post.founderNumber ?? 0,
    content: post.content,
    category: post.category,
    likes: post.likes,
    createdTime: post.createdAt.toISOString(),
    comments: post.comments.map(comment => ({
      id: comment.id,
      authorId: comment.authorId,
      parentId: comment.parentId,
      author: comment.author?.name || comment.authorName,
      authorImage: comment.author?.image || null,
      authorSlug: comment.author?.profileSlug || null,
      founderNumber: comment.author?.founderNumber || 0,
      content: comment.content,
      likes: comment.likes,
      time: comment.createdAt.toISOString(),
      userVote: commentVotes.get(comment.id) || 0,
    })),
    userVote: userVotes.get(post.id) || 0,
  });
  });
}

export default async function ForumPage() {
  const session = await auth();
  const email = session?.user?.email || null;

  const [initialPosts, initialUser, forumVentureId] = await Promise.all([
    getInitialPosts(email),
    email ? getInitialUser(email) : Promise.resolve(null),
    getOrCreateForumVentureId(email),
  ]);

  return (
    <ForumClient
      initialPosts={initialPosts}
      initialUser={initialUser}
      forumVentureId={forumVentureId}
    />
  );
}
