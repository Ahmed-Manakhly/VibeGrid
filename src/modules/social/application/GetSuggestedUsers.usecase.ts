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
      const cached = await this.cacheService.get<any[]>(cacheKey);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }
      const fresh = await this.repo.getSuggestedUsers(userId);
      // Stop negative caching: only write if users exist
      if (fresh && Array.isArray(fresh) && fresh.length > 0) {
        await this.cacheService.set(cacheKey, fresh, 600);
      }
      return fresh;
    }
    return this.repo.getSuggestedUsers(userId);
  }
}

