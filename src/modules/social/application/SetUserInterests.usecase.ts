import { IUserInterestRepository } from '@/modules/social/domain/IUserInterestRepository';

type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
};

export class SetUserInterestsUseCase {
  constructor(private readonly userInterestRepo: IUserInterestRepository) {}

  async execute(userId: string, categoryIds: string[]): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!Array.isArray(categoryIds)) {
      throw new Error('categoryIds must be an array');
    }
    await this.userInterestRepo.setUserInterests(userId, categoryIds);
  }
}
