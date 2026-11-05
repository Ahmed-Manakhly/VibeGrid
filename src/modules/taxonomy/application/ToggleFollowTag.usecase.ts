import { ITagFollowRepository } from "../domain/ITagFollowRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";

export class ToggleFollowTagUseCase {
  constructor(
    private tagFollowRepo: ITagFollowRepository,
    private cacheService?: ICacheService
  ) {}

  async execute(userId: string, tagId: string): Promise<{ success: boolean; isFollowing?: boolean; followersCount?: number; error?: string }> {
    try {
      if (!userId || !tagId) {
        return { success: false, error: "User ID and Tag ID are required" };
      }

      const result = await this.tagFollowRepo.toggleFollow(userId, tagId);

      // Invalidate user's personal timeline cache key so their next feed request recalculates topic boost
      if (this.cacheService) {
        await this.cacheService.delete(`timeline:${userId}`);
        await this.cacheService.delete(`tags:followed:${userId}`);
      }

      return {
        success: true,
        isFollowing: result.isFollowing,
        followersCount: result.followersCount,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to toggle tag follow",
      };
    }
  }
}
