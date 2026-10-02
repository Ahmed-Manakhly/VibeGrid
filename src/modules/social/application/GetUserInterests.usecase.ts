import { IUserInterestRepository } from '@/modules/social/domain/IUserInterestRepository';

type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
};

export class GetUserInterestsUseCase {
  constructor(private readonly userInterestRepo: IUserInterestRepository) {}

  async execute(userId: string): Promise<CategoryDTO[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.userInterestRepo.getUserInterests(userId);
  }
}
