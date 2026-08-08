import { IVibeRepository } from "../domain/IVibeRepository";
// import { vibeRepository } from "../infrastructure/PrismaVibeRepository";

export class GenerateFeedUseCase {
  constructor(private repo: IVibeRepository) {}

  async execute() {
    return this.repo.getFeed();
  }
}
