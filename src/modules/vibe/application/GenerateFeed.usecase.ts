import { IVibeRepository, VibePost } from "../domain/IVibeRepository";
import { ExplorePostsCriteria, ExplorePostsResult } from "../domain/ExplorePostsCriteria";
import { ICacheService } from "@/shared/application/ports/ICacheService";

export class GenerateFeedUseCase {
  constructor(
    private repo: IVibeRepository,
    private cacheService?: ICacheService
  ) {}

  async execute(params: ExplorePostsCriteria = {}): Promise<ExplorePostsResult<VibePost>> {
    const { userId, tag, category, vibe, search, limit = 10, cursor } = params;

    // 1. Personalized Timeline Redis Hydration (if userId provided & no specific filters)
    if (userId && !tag && !category && !vibe && !search && this.cacheService) {
      try {
        const feedKey = `timeline:${userId}`;
        const cachedPostIds = await this.cacheService.get<string[]>(feedKey);

        if (cachedPostIds && cachedPostIds.length > 0) {
          const hydratedPosts = await this.repo.getPostsByIds(cachedPostIds.slice(0, limit));
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

    // 2. Direct Query Fallback with Stampede-Protected Query Caching
    if (this.cacheService && !cursor) {
      const cacheKey = `feed:query:${tag || 'all'}:${category || 'all'}:${vibe || 'all'}:${search || 'none'}:${limit}`;
      return this.cacheService.getOrSet(
        cacheKey,
        () => this.repo.getFeed(params),
        { ttlSeconds: 60, enableJitter: true }
      );
    }

    return this.repo.getFeed(params);
  }
}
