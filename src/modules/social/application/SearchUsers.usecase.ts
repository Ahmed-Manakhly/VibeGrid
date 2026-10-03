import { ISocialRepository } from "../domain/ISocialRepository";

export class SearchUsersUseCase {
  constructor(private socialRepository: ISocialRepository) {}

  async execute(query: string, limit: number = 6) {
    if (!query || !query.trim()) {
      return [];
    }
    return this.socialRepository.searchUsers(query.trim(), limit);
  }
}
