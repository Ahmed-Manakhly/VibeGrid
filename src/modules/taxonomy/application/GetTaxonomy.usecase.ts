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
      return await this.cacheService.getOrSet(
        RedisKeys.tagsAll(),
        async () => {
          const [categories, vibes] = await Promise.all([
            this.repo.getCategories(),
            this.repo.getVibes(),
          ]);
          return { categories, vibes };
        },
        { ttlSeconds: CACHE_TTL.TAGS_ALL, enableJitter: true }
      );
    }

    const [categories, vibes] = await Promise.all([
      this.repo.getCategories(),
      this.repo.getVibes(),
    ]);

    return { categories, vibes };
  }
}

