import { ISocialRepository } from "../domain/ISocialRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";
import { ICacheService } from "@/shared/application/ports/ICacheService";

export class ToggleFollowUseCase {
  constructor(
    private socialRepository: ISocialRepository, 
    private eventBus: IEventBus,
    private cacheService?: ICacheService
  ) {}

  async execute(userId: string, targetUserId: string) {
    if (!userId) return { success: false, error: "No user id" };
    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    const existingFollow = await this.socialRepository.getFollow(userId, targetUserId);

    if (existingFollow) {
      await this.socialRepository.removeFollow(userId, targetUserId);
    } else {
      await this.socialRepository.addFollow(userId, targetUserId);
      
      await this.eventBus.publish("UserFollowedEvent", {
        followerId: userId,
        followingId: targetUserId,
        timestamp: new Date(),
      });
    }

    // Invalidate cached suggested users so followed user disappears immediately
    if (this.cacheService) {
      const { RedisKeys } = await import("@/shared/infrastructure/cache/RedisKeys");
      await Promise.all([
        this.cacheService.delete(`social:suggested:${userId}`).catch(() => {}),
        this.cacheService.delete(RedisKeys.user(userId)).catch(() => {}),
        this.cacheService.delete(RedisKeys.user(targetUserId)).catch(() => {}),
      ]);
    }

    return { success: true };
  }
}
