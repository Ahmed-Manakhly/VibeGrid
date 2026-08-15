import { IEngagementRepository } from "../domain/IEngagementRepository";

export class DeleteCommentUseCase {
  constructor(private repo: IEngagementRepository) {}

  async execute(commentId: string, userId: string) {
    return this.repo.deleteComment(commentId, userId);
  }
}
