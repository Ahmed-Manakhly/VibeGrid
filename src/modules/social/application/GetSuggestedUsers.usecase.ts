import { ISocialRepository } from "../domain/ISocialRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";

export class GetSuggestedUsersUseCase {
  constructor(
    private repo: ISocialRepository,
    private cacheService?: ICacheService
  ) {}

  async execute(userId?: string) {
    const cacheKey = `social:suggested:${userId || 'anonymous'}`;
    if (this.cacheService) {
      return this.cacheService.getOrSet(
        cacheKey,
        () => this.repo.getSuggestedUsers(userId),
        { ttlSeconds: 600, enableJitter: true }
      );
    }
    return this.repo.getSuggestedUsers(userId);
  }
}
