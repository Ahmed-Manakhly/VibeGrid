import { FeedRecommendationScorer } from "../src/modules/vibe/domain/FeedRecommendationScorer";
import { VibePost } from "../src/modules/vibe/domain/IVibeRepository";

describe("Follow Technologies & Topic Routing - Domain Invariants", () => {
  it("FeedRecommendationScorer adds +25 points when post contains a followed tech tag", () => {
    const scorer = new FeedRecommendationScorer();

    const postWithoutTag: VibePost = {
      id: "post-1",
      content: "General coding discussion",
      mediaUrl: null,
      mediaType: null,
      createdAt: new Date(),
      author: {
        id: "author-1",
        username: "coder",
        name: "Coder",
        image: null,
      },
      tags: [],
      likes: [],
      comments: [],
      _count: {
        likes: 0,
        comments: 0,
      },
    };

    const postWithTechTag: VibePost = {
      ...postWithoutTag,
      id: "post-2",
      tags: [
        {
          tag: {
            id: "tag-prisma",
            name: "Prisma",
            slug: "prisma",
            createdAt: new Date(),
          },
        },
      ],
    };

    const contextWithFollowedTag = {
      userId: "user-123",
      followedTagIds: new Set(["tag-prisma"]),
    };

    const scoreWithout = scorer.scorePost(postWithoutTag, contextWithFollowedTag);
    const scoreWith = scorer.scorePost(postWithTechTag, contextWithFollowedTag);

    expect(scoreWith).toBeGreaterThanOrEqual(scoreWithout + 25);
  });
});
