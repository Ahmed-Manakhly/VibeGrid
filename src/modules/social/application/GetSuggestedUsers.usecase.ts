import { ISocialRepository } from "../domain/ISocialRepository";

export class GetSuggestedUsersUseCase {
  constructor(private repo: ISocialRepository) {}

  async execute(userId: string) {
    if (!userId) return [];
    return this.repo.getSuggestedUsers(userId);
  }
}
