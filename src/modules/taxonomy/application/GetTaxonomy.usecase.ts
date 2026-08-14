import { ITaxonomyRepository } from "../domain/ITaxonomyRepository";

export class GetTaxonomyUseCase {
  constructor(private repo: ITaxonomyRepository) {}

  async execute() {
    const [categories, vibes] = await Promise.all([
      this.repo.getCategories(),
      this.repo.getVibes(),
    ]);

    return { categories, vibes };
  }
}
