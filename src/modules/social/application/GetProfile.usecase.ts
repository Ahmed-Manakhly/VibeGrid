import { IProfileRepository } from "../domain/IProfileRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { RedisKeys, CACHE_TTL } from "@/shared/infrastructure/cache/RedisKeys";

export class GetProfileUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly cacheService?: ICacheService
  ) {}

  async execute(username: string) {
    if (!username) {
      throw new Error("Username is required");
    }

    if (this.cacheService) {
      const cacheKey = RedisKeys.user(username);
      return await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          const profile = await this.profileRepository.getProfileByUsername(username);
          if (!profile) throw new Error("Profile not found");
          return profile;
        },
        { ttlSeconds: CACHE_TTL.USER, enableJitter: true }
      );
    }

    const profile = await this.profileRepository.getProfileByUsername(username);
    if (!profile) {
      throw new Error("Profile not found");
    }
    return profile;
  }
}

