import { ITaxonomyRepository, Category } from "../domain/ITaxonomyRepository";

export class CreateCategoryUseCase {
  constructor(private repo: ITaxonomyRepository) {}

  async execute(data: { name: string; slug: string; emoji?: string }): Promise<Category> {
    return this.repo.createCategory(data);
  }
}
