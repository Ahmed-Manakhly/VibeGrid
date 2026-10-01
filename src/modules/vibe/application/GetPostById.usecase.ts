import { IVibeRepository } from "../domain/IVibeRepository";

export class GetPostByIdUseCase {
  constructor(private vibeRepository: IVibeRepository) {}

  async execute(postId: string) {
    if (!postId) return null;
    return await this.vibeRepository.getPostById(postId);
  }
}
