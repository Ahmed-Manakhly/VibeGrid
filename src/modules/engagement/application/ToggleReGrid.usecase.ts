import { IEngagementRepository } from "../domain/IEngagementRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";

export class ToggleReGridUseCase {
  constructor(
    private engagementRepository: IEngagementRepository,
    private eventBus: IEventBus
  ) {}

  async execute(vibeId: string, userId: string) {
    const result = await this.engagementRepository.toggleReGrid(vibeId, userId);
    if (result.success && result.value.isReGridded) {
      await this.eventBus.publish("ReGridCreatedEvent", {
        vibeId,
        regridderId: userId,
        authorId: result.value.authorId,
        timestamp: new Date(),
      });
    }
    return result;
  }
}
