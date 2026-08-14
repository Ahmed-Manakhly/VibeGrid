import { IVibeRepository } from "../domain/IVibeRepository";
// import { vibeRepository } from "../infrastructure/PrismaVibeRepository";

export class DeleteVibeUseCase {
  constructor(private repo: IVibeRepository) {}

  async execute(vibeId: string, authorId: string) {
    return this.repo.deletePost(vibeId, authorId);
  }
}
