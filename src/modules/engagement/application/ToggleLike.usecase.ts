import { IEngagementRepository } from "../domain/IEngagementRepository";
// import { engagementRepository } from "../infrastructure/PrismaEngagementRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";

export class ToggleLikeUseCase {
  constructor(private engagementRepository: IEngagementRepository, private eventBus: IEventBus) {}

  async execute(vibeId: string, userId: string) {
    const result = await this.engagementRepository.toggleLike(vibeId, userId);
    if (result.success && result.value.isLiked) {
      if (result.value.authorId !== userId) {
        await this.eventBus.publish("LikeToggledEvent", {
          vibeId,
          likerId: userId,
          authorId: result.value.authorId,
          timestamp: new Date(),
        });
      }
    }
    return result;
  }
}
