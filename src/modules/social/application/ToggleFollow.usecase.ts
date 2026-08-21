import { ISocialRepository } from "../domain/ISocialRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";

export class ToggleFollowUseCase {
  constructor(private socialRepository: ISocialRepository, private eventBus: IEventBus) {}

  async execute(userId: string, targetUserId: string) {
    if (!userId) return { success: false, error: "No user id" };
    if (userId === targetUserId) throw new Error("You cannot follow yourself");

    const existingFollow = await this.socialRepository.getFollow(userId, targetUserId);

    if (existingFollow) {
      await this.socialRepository.removeFollow(userId, targetUserId);
    } else {
      await this.socialRepository.addFollow(userId, targetUserId);
      
      this.eventBus.publish("UserFollowedEvent", {
        followerId: userId,
        followingId: targetUserId,
        timestamp: new Date(),
      });
    }

    return { success: true };
  }
}
