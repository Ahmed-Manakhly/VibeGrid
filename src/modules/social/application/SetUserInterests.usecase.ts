import { IUserInterestRepository } from '@/modules/social/domain/IUserInterestRepository';
import { ITaxonomyRepository } from '@/modules/taxonomy/domain/ITaxonomyRepository';

export class SetUserInterestsUseCase {
  constructor(
    private readonly userInterestRepo: IUserInterestRepository,
    private readonly taxonomyRepo: ITaxonomyRepository
  ) {}

  async execute(userId: string, categoryIds: string[]): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!Array.isArray(categoryIds)) {
      throw new Error('categoryIds must be an array');
    }

    // Deduplicate category IDs
    const uniqueCategoryIds = Array.from(new Set(categoryIds));

    if (uniqueCategoryIds.length > 0) {
      const allCategories = await this.taxonomyRepo.getCategories();
      const validCategoryIds = new Set(allCategories.map((c) => c.id));

      for (const id of uniqueCategoryIds) {
        if (!validCategoryIds.has(id)) {
          throw new Error(`Invalid category ID: ${id}`);
        }
      }
    }

    await this.userInterestRepo.setUserInterests(userId, uniqueCategoryIds);
  }
}

