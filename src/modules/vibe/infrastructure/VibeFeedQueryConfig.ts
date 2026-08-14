import { FeedQueryConfig } from "@/shared/kernel/FeedQueryBuilder";

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
    comments: true,
    likes: { select: { userId: true } },
    _count: { select: { likes: true, comments: true } },
  },
};
