import { ITaxonomyRepository } from "../domain/ITaxonomyRepository";

export class GetTrendingTagsUseCase {
  constructor(private repo: ITaxonomyRepository) {}

  async execute(limit: number = 20) {
    return this.repo.getTrendingTags(limit);
  }
}
