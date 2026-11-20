import { FeedQueryConfig } from "@/shared/infrastructure/persistence/query/FeedQueryBuilder";

export function getVibeFeedRelations(viewerUserId?: string) {
  const baseRelations: any = {
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
    _count: {
      select: {
        likes: true,
        bookmarks: true,
        regrids: true,
        comments: {
          where: { parentId: null }
        }
      }
    },
  };

  // If viewer is logged in, selectively fetch AT MOST 1 pinned comment that the viewer participated in (authored comment or replied to a comment)
  if (viewerUserId) {
    baseRelations.comments = {
      where: {
        parentId: null,
        OR: [
          { authorId: viewerUserId },
          { replies: { some: { authorId: viewerUserId } } },
        ],
      },
      take: 1,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        likes: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
            likes: {
              select: {
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    image: true,
                  },
                },
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    };
  }

  return baseRelations;
}

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
  defaultRelations: getVibeFeedRelations(),
};
