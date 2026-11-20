import { IVibeRepository, VibePost } from "../domain/IVibeRepository";
import { ExplorePostsCriteria, ExplorePostsResult } from "../domain/ExplorePostsCriteria";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { FeedRecommendationScorer, FeedScoringContext } from "../domain/FeedRecommendationScorer";
import { ISocialRepository } from "@/modules/social/domain/ISocialRepository";
import { IUserInterestRepository } from "@/modules/social/domain/IUserInterestRepository";
import { ITagFollowRepository } from "@/modules/taxonomy/domain/ITagFollowRepository";

export class GenerateFeedUseCase {
  private scorer = new FeedRecommendationScorer();

  constructor(
    private repo: IVibeRepository,
    private cacheService?: ICacheService,
    private socialRepo?: ISocialRepository,
    private userInterestRepo?: IUserInterestRepository,
    private tagFollowRepo?: ITagFollowRepository
  ) {}

  async execute(params: ExplorePostsCriteria = {}): Promise<ExplorePostsResult<VibePost>> {
    const { userId, tag, category, vibe, search, limit = 12, cursor, communityId, allowedCommunityIds } = params;

    // 1. Personalized Timeline Redis Hydration (if userId provided & no specific filters)
    if (userId && !tag && !category && !vibe && !search && this.cacheService) {
      try {
        const feedKey = `timeline:${userId}`;
        const cachedPostIds = await this.cacheService.get<string[]>(feedKey);

        if (cachedPostIds && cachedPostIds.length > 0) {
          const hydratedPosts = await this.repo.getPostsByIds(cachedPostIds.slice(0, limit), userId);
          if (hydratedPosts.length > 0) {
            const nextCursor = hydratedPosts.length >= limit ? hydratedPosts[hydratedPosts.length - 1].id : null;
            return {
              data: hydratedPosts,
              nextCursor,
            };
          }
        }
      } catch (err) {
        // Fallback gracefully on cache error
      }
    }

    // 2. Fetch raw candidates from repository
    let rawResult: ExplorePostsResult<VibePost>;

    if (this.cacheService && !cursor && !userId) {
      const allowedKey = allowedCommunityIds ? allowedCommunityIds.sort().join(',') : 'all';
      const cacheKey = `feed:query:${communityId || 'none'}:${allowedKey}:${tag || 'all'}:${category || 'all'}:${vibe || 'all'}:${search || 'none'}:${limit}`;
      rawResult = await this.cacheService.getOrSet(
        cacheKey,
        () => this.repo.getFeed(params),
        { ttlSeconds: 60, enableJitter: true }
      );
    } else {
      rawResult = await this.repo.getFeed(params);
    }

    if (!rawResult.data || rawResult.data.length === 0) {
      return rawResult;
    }

    // 3. Build Recommendation Scoring Context if userId is provided
    let scoringContext: FeedScoringContext = {};
    if (userId) {
      try {
        const [followingIds, userInterests, followedTagIds] = await Promise.all([
          this.socialRepo ? this.socialRepo.getFollowingIds(userId) : Promise.resolve([]),
          this.userInterestRepo ? this.userInterestRepo.getUserInterests(userId) : Promise.resolve([]),
          this.tagFollowRepo ? this.tagFollowRepo.getFollowedTagIds(userId) : Promise.resolve([]),
        ]);

        scoringContext = {
          userId,
          followedAuthorIds: new Set(followingIds),
          userInterestedCategoryIds: new Set(userInterests.map((cat: any) => cat.id)),
          followedTagIds: new Set(followedTagIds),
        };
      } catch (err) {
        // Fallback to unpersonalized context on repository error
        scoringContext = { userId };
      }
    }

    // 4. Deterministically rank candidate posts using FeedRecommendationScorer
    const rankedPosts = this.scorer.rankPosts(rawResult.data, scoringContext);

    // 5. Hydrate author relationship metadata (isFollowing) if viewer is authenticated
    if (scoringContext.followedAuthorIds) {
      for (const post of rankedPosts) {
        if (post.author) {
          (post.author as any).isFollowing = scoringContext.followedAuthorIds.has(post.author.id);
        }
      }
    }

    return {
      data: rankedPosts,
      nextCursor: rawResult.nextCursor,
    };
  }
}
