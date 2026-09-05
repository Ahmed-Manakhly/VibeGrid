import { IVibeRepository } from "../domain/IVibeRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";
import { ICacheService } from "@/shared/application/ports/ICacheService";

export class DeleteVibeUseCase {
  constructor(
    private repo: IVibeRepository,
    private eventBus?: IEventBus,
    private cacheService?: ICacheService
  ) {}

  async execute(vibeId: string, authorId: string) {
    const result = await this.repo.deletePost(vibeId, authorId);
    if (result.success) {
      if (this.cacheService?.delByPattern) {
        await this.cacheService.delByPattern("feed:query:*");
        await this.cacheService.delByPattern(`timeline:${authorId}`);
      }
      if (this.eventBus) {
        await this.eventBus.publish("PostDeletedEvent", {
          postId: vibeId,
          authorId,
          timestamp: new Date(),
        });
      }
    }
    return result;
  }
}
