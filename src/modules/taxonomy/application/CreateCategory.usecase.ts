import { ITaxonomyRepository, Category } from "../domain/ITaxonomyRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { RedisKeys } from "@/shared/infrastructure/cache/RedisKeys";

export class CreateCategoryUseCase {
  constructor(
    private repo: ITaxonomyRepository,
    private cacheService?: ICacheService
  ) {}

  async execute(data: { name: string; slug: string; emoji?: string }): Promise<Category> {
    const category = await this.repo.createCategory(data);
    if (this.cacheService) {
      await this.cacheService.delete(RedisKeys.tagsAll()).catch(() => {});
    }
    return category;
  }
}

