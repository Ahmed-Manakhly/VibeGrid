import { IProfileRepository } from "../domain/IProfileRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { RedisKeys } from "@/shared/infrastructure/cache/RedisKeys";

export class UpdateProfileUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly cacheService?: ICacheService
  ) {}

  async execute(userId: string, data: { name?: string; username?: string; bio?: string; location?: string; website?: string; image?: string }) {
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const profile = await this.profileRepository.updateProfile(userId, data);

    if (this.cacheService && profile) {
      if (userId) {
        await this.cacheService.delete(RedisKeys.user(userId)).catch(() => {});
      }
      if (profile.username) {
        await this.cacheService.delete(RedisKeys.user(profile.username)).catch(() => {});
      }
      if (data.username && data.username !== profile.username) {
        await this.cacheService.delete(RedisKeys.user(data.username)).catch(() => {});
      }
    }

    return { success: true, user: profile };
  }
}

