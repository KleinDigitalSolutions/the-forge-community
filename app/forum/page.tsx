import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { assignFounderNumberIfMissing } from '@/lib/founder-number';
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

  if (!user) return null;

  const founderNumber = await assignFounderNumberIfMissing(user.id);
  return { ...user, founderNumber };
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

  const missingAuthorNames = Array.from(
    new Set(
      posts
        .filter(post => !post.authorId && post.authorName && post.authorName !== 'Anonymous Founder')
        .map(post => post.authorName)
    )
  );

  const fallbackUsers = missingAuthorNames.length > 0
    ? await prisma.user.findMany({
        where: {
          OR: missingAuthorNames.map(name => ({
            name: { equals: name, mode: 'insensitive' }
          }))
        },
        select: {
          id: true,
          name: true,
          image: true,
          profileSlug: true,
          founderNumber: true,
        }
      })
    : [];

  const fallbackByName = new Map<string, { image: string | null; profileSlug: string | null; founderNumber: number | null; name: string | null; id: string }>();
  await Promise.all(
    fallbackUsers.map(async user => {
      const slug = user.profileSlug || await ensureProfileSlug({
        id: user.id,
        name: user.name,
        founderNumber: user.founderNumber,
        profileSlug: user.profileSlug,
      });
      const key = user.name?.trim().toLowerCase();
      if (key) {
        fallbackByName.set(key, {
          id: user.id,
          name: user.name,
          image: user.image ?? null,
          profileSlug: slug,
          founderNumber: user.founderNumber ?? null,
        });
      }
    })
  );

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

  const authorCandidates = new Map<string, { id: string; name: string | null; founderNumber: number | null; profileSlug: string | null }>();
  posts.forEach(post => {
    if (post.author?.id) {
      authorCandidates.set(post.author.id, {
        id: post.author.id,
        name: post.author.name ?? null,
        founderNumber: post.author.founderNumber ?? null,
        profileSlug: post.author.profileSlug ?? null,
      });
    }
  });

  const slugEntries = await Promise.all(
    Array.from(authorCandidates.values()).map(async author => {
      if (author.profileSlug) return [author.id, author.profileSlug] as const;
      const slug = await ensureProfileSlug({
        id: author.id,
        name: author.name,
        founderNumber: author.founderNumber,
        profileSlug: author.profileSlug,
      });
      return [author.id, slug] as const;
    })
  );
  const slugByAuthorId = new Map(slugEntries);

  return posts.map(post => {
    const fallbackAuthor = (!post.authorId && post.authorName)
      ? fallbackByName.get(post.authorName.trim().toLowerCase())
      : null;

    return ({
    id: post.id,
    authorId: post.authorId,
    author: post.authorName,
    authorImage: post.author?.image || fallbackAuthor?.image || null,
    authorSlug: (post.author?.id ? slugByAuthorId.get(post.author.id) : null) || post.author?.profileSlug || fallbackAuthor?.profileSlug || null,
    founderNumber: post.founderNumber || fallbackAuthor?.founderNumber || 0,
    content: post.content,
    category: post.category,
    likes: post.likes,
    createdTime: post.createdAt.toISOString(),
    comments: post.comments.map(comment => ({
      id: comment.id,
      authorId: comment.authorId,
      parentId: comment.parentId,
      author: comment.authorName,
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

  const [initialPosts, initialUser] = await Promise.all([
    getInitialPosts(email),
    email ? getInitialUser(email) : Promise.resolve(null),
  ]);

  return <ForumClient initialPosts={initialPosts} initialUser={initialUser} />;
}
