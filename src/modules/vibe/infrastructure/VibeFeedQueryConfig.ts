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
  },
  defaultRelations: {
    author: true,
    tags: { include: { tag: true } },
    category: true,
    vibe: true,
    comments: { 
      where: { parentId: null },
      include: { 
        author: true,
        replies: { include: { author: true }, orderBy: { createdAt: "asc" } } 
      }, 
      orderBy: { createdAt: "asc" } 
    },
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
        user: { select: { id: true, name: true, username: true, image: true } },
      }
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
    _count: { select: { likes: true, comments: true, bookmarks: true, regrids: true } },
  },
};
