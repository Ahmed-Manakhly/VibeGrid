import { ISocialRepository } from "../domain/ISocialRepository";

export class GetSuggestedUsersUseCase {
  constructor(private repo: ISocialRepository) {}

  async execute(userId?: string) {
    return this.repo.getSuggestedUsers(userId);
  }
}
