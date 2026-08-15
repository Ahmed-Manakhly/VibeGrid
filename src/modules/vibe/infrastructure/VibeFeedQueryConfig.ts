import { FeedQueryConfig } from "@/shared/infrastructure/persistence/query/FeedQueryBuilder";

export const vibeFeedQueryConfig: FeedQueryConfig = {
  defaultLimit: 12,
  defaultSort: { createdAt: "desc" },
  searchFields: ["content"],
  fieldConfigs: {
    tag: "relation-array",
    category: "relation-scalar",
    vibe: "relation-scalar",
  },
  defaultRelations: {
    author: true,
    tags: { include: { tag: true } },
    category: true,
    vibe: true,
    comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    likes: { select: { userId: true } },
    _count: { select: { likes: true, comments: true } },
  },
};
