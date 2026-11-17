import { ISocialRepository } from "../domain/ISocialRepository";
import { IProfileRepository } from "../domain/IProfileRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";
import { ICacheService } from "@/shared/application/ports/ICacheService";

export class ToggleFollowUseCase {
  constructor(
    private socialRepository: ISocialRepository, 
    private eventBus: IEventBus,
    private cacheService?: ICacheService,
    private profileRepository?: IProfileRepository
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

    // Invalidate cached suggested users and user profiles
    if (this.cacheService) {
      const { RedisKeys } = await import("@/shared/infrastructure/cache/RedisKeys");
      const deletes: Promise<any>[] = [
        this.cacheService.delete(`social:suggested:${userId}`).catch(() => {}),
        this.cacheService.delete(RedisKeys.user(userId)).catch(() => {}),
        this.cacheService.delete(RedisKeys.user(targetUserId)).catch(() => {}),
      ];

      if (this.profileRepository && this.profileRepository.getUserById) {
        try {
          const [u1, u2] = await Promise.all([
            this.profileRepository.getUserById(userId),
            this.profileRepository.getUserById(targetUserId),
          ]);
          if (u1?.username) deletes.push(this.cacheService.delete(RedisKeys.user(u1.username)).catch(() => {}));
          if (u2?.username) deletes.push(this.cacheService.delete(RedisKeys.user(u2.username)).catch(() => {}));
        } catch {
          // Non-blocking cache bust
        }
      }

      await Promise.all(deletes);
    }

    return { success: true };
  }
}
