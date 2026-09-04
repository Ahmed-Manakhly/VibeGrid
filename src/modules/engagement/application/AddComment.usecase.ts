import { IEngagementRepository } from "../domain/IEngagementRepository";
// import { engagementRepository } from "../infrastructure/PrismaEngagementRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";

export class AddCommentUseCase {
  constructor(private engagementRepository: IEngagementRepository, private eventBus: IEventBus) {}

  async execute(vibeId: string, userId: string, content: string) {
    const result = await this.engagementRepository.addComment(vibeId, userId, content);
    if (result.success) {
      if (result.value.authorId !== userId) {
        await this.eventBus.publish("CommentAddedEvent", {
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
