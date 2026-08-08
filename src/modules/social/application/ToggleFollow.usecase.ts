import { ISocialRepository } from "../domain/ISocialRepository";
import { DomainEventBus } from "@/shared/infrastructure/EventBus";

export class ToggleFollowUseCase {
  constructor(private repo: ISocialRepository) {}

  async execute(userId: string, targetUserId: string) {
    if (!userId) return { success: false, error: "No user id" };
    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    const existingFollow = await this.repo.getFollow(userId, targetUserId);

    if (existingFollow) {
      await this.repo.removeFollow(userId, targetUserId);
    } else {
      await this.repo.addFollow(userId, targetUserId);
      
      // Publish event instead of tightly coupling to Notification module!
      DomainEventBus.publish("UserFollowedEvent", {
        followerId: userId,
        followingId: targetUserId,
        timestamp: new Date(),
      });
    }

    return { success: true };
  }
}
