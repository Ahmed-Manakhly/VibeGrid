import { ITaxonomyRepository, Vibe } from "../domain/ITaxonomyRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { RedisKeys } from "@/shared/infrastructure/cache/RedisKeys";

export class CreateVibeTaxonomyUseCase {
  constructor(
    private repo: ITaxonomyRepository,
    private cacheService?: ICacheService
  ) {}

  async execute(data: { key: string; label: string }): Promise<Vibe> {
    const vibe = await this.repo.createVibe(data);
    if (this.cacheService) {
      await this.cacheService.delete(RedisKeys.tagsAll()).catch(() => {});
    }
    return vibe;
  }
}

