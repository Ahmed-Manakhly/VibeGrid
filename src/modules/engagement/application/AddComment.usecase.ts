import { IEngagementRepository } from "../domain/IEngagementRepository";
// import { engagementRepository } from "../infrastructure/PrismaEngagementRepository";
import { DomainEventBus } from "@/shared/infrastructure/EventBus";

export class AddCommentUseCase {
  constructor(private repo: IEngagementRepository) {}

  async execute(vibeId: string, userId: string, content: string) {
    const result = await this.repo.addComment(vibeId, userId, content);
    if (result.success) {
      if (result.value.authorId !== userId) {
        DomainEventBus.publish("CommentAddedEvent", {
          vibeId,
          commentId: result.value.commentId,
          commenterId: userId,
          authorId: result.value.authorId,
          timestamp: new Date(),
        });
      }
    }
    return result;
  }
}
