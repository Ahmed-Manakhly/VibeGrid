import { IEngagementRepository } from "../domain/IEngagementRepository";
// import { engagementRepository } from "../infrastructure/PrismaEngagementRepository";
import { DomainEventBus } from "@/shared/infrastructure/EventBus";

export class ToggleLikeUseCase {
  constructor(private repo: IEngagementRepository) {}

  async execute(vibeId: string, userId: string) {
    const result = await this.repo.toggleLike(vibeId, userId);
    if (result.success && result.value.isLiked) {
      if (result.value.authorId !== userId) {
        DomainEventBus.publish("LikeToggledEvent", {
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
