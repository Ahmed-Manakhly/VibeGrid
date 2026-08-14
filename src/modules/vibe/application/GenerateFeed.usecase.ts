import { IVibeRepository, VibePost } from "../domain/IVibeRepository";
import { FeedQueryParams, FeedResult } from "@/shared/kernel/FeedQueryParams";
// import { vibeRepository } from "../infrastructure/PrismaVibeRepository";

export class GenerateFeedUseCase {
  constructor(private repo: IVibeRepository) {}

  async execute(params: FeedQueryParams = {}): Promise<FeedResult<VibePost>> {
    return this.repo.getFeed(params);
  }
}
