import { ITaxonomyRepository } from "../domain/ITaxonomyRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { RedisKeys, CACHE_TTL } from "@/shared/infrastructure/cache/RedisKeys";

export class GetTaxonomyUseCase {
  constructor(
    private repo: ITaxonomyRepository,
    private cacheService?: ICacheService
  ) {}

  async execute() {
    if (this.cacheService) {
      const cached = await this.cacheService.get<{ categories: any[]; vibes: any[] }>(RedisKeys.tagsAll());
      // Only serve cache if it contains actual data (prevents negative-cache lock)
      if (cached && (cached.categories?.length > 0 || cached.vibes?.length > 0)) {
        return cached;
      }

      const [categories, vibes] = await Promise.all([
        this.repo.getCategories(),
        this.repo.getVibes(),
      ]);

      const result = { categories, vibes };

      // Stop negative caching: only write to Redis if there are actually categories or vibes!
      if (categories.length > 0 || vibes.length > 0) {
        await this.cacheService.set(RedisKeys.tagsAll(), result, CACHE_TTL.TAGS_ALL);
      }

      return result;
    }

    const [categories, vibes] = await Promise.all([
      this.repo.getCategories(),
      this.repo.getVibes(),
    ]);

    return { categories, vibes };
  }
}

