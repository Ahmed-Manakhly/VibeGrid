import { IEngagementRepository } from "../domain/IEngagementRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";
import { ICacheService } from "@/shared/application/ports/ICacheService";

export class ToggleReGridUseCase {
  constructor(
    private engagementRepository: IEngagementRepository,
    private eventBus: IEventBus,
    private cacheService?: ICacheService
  ) {}

  async execute(vibeId: string, userId: string) {
    const result = await this.engagementRepository.toggleReGrid(vibeId, userId);
    if (result.success) {
      if (this.cacheService?.delByPattern) {
        await this.cacheService.delByPattern("feed:query:*");
        await this.cacheService.delByPattern(`timeline:*`);
      }
      if (result.value.isReGridded) {
        await this.eventBus.publish("ReGridCreatedEvent", {
          vibeId,
          regridderId: userId,
          authorId: result.value.authorId,
          timestamp: new Date(),
        });
      }
    }
    return result;
  }
}
