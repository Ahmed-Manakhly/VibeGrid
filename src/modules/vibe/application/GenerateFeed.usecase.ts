import { IVibeRepository, VibePost } from "../domain/IVibeRepository";
import { ExplorePostsCriteria, ExplorePostsResult } from "../domain/ExplorePostsCriteria";
// import { vibeRepository } from "../infrastructure/PrismaVibeRepository";

export class GenerateFeedUseCase {
  constructor(private repo: IVibeRepository) {}

  async execute(params: ExplorePostsCriteria = {}): Promise<ExplorePostsResult<VibePost>> {
    return this.repo.getFeed(params);
  }
}
