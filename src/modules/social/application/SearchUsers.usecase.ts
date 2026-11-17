import { ISocialRepository } from "../domain/ISocialRepository";

export class SearchUsersUseCase {
  constructor(private socialRepository: ISocialRepository) {}

  async execute(query: string, limit: number = 6, viewerId?: string) {
    if (!query || !query.trim()) {
      return [];
    }
    if (viewerId !== undefined) {
      return this.socialRepository.searchUsers(query.trim(), limit, viewerId);
    }
    return this.socialRepository.searchUsers(query.trim(), limit);
  }
}
