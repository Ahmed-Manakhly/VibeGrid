import { FeedQueryConfig } from "@/shared/infrastructure/persistence/query/FeedQueryBuilder";

export const vibeFeedQueryConfig: FeedQueryConfig = {
  defaultLimit: 12,
  defaultSort: { createdAt: "desc" },
  searchFields: ["content", "author.name", "author.username", "tags.tag.name"],
  fieldConfigs: {
    tag: (value: string) => ({ tags: { some: { tag: { slug: value } } } }),
    tags: "relation-array",
    category: "relation-scalar",
    vibe: (value: string) => ({ vibe: { key: value } }),
    authorId: "scalar",
    likedByUserId: (value: string) => ({
      likes: { some: { userId: value } }
    }),
    bookmarkedByUserId: (value: string) => ({
      bookmarks: { some: { userId: value } }
    }),
    excludeAuthorIds: (value: string[]) => ({
      authorId: { notIn: value }
    }),
    communityId: "scalar",
    allowedCommunityIds: (communityIds: string[]) => {
      if (!communityIds || communityIds.length === 0) {
        return { communityId: null };
      }
      return {
        OR: [
          { communityId: null },
          { communityId: { in: communityIds } },
        ],
      };
    },
  },
  defaultRelations: {
    author: true,
    tags: { include: { tag: true } },
    category: true,
    vibe: true,
    likes: {
      select: {
        userId: true,
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    },
    bookmarks: {
      select: {
        userId: true
      }
    },
    regrids: {
      select: {
        userId: true,
        createdAt: true,
        user: { select: { id: true, name: true, username: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    },
    poll: {
      include: {
        options: {
          orderBy: { index: "asc" },
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        votes: true
      }
    },
    quotedPost: {
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: true } },
      }
    },
    community: {
      select: {
        id: true,
        name: true,
        slug: true,
        avatarUrl: true,
        members: {
          select: { userId: true },
        },
      },
    },
    _count: { select: { likes: true, comments: true, bookmarks: true, regrids: true } },
  },
};
