import { IEngagementRepository } from "../domain/IEngagementRepository";
// import { engagementRepository } from "../infrastructure/PrismaEngagementRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";

export class AddCommentUseCase {
  constructor(private engagementRepository: IEngagementRepository, private eventBus: IEventBus) {}

  async execute(vibeId: string, userId: string, content: string, parentId?: string, mediaUrl?: string, mediaType?: string) {
    const result = await this.engagementRepository.addComment(vibeId, userId, content, parentId, mediaUrl, mediaType);
    if (result.success) {
      // 1. If this is a reply to another comment, notify the parent comment's author
      if (result.value.parentAuthorId && result.value.parentAuthorId !== userId) {
        await this.eventBus.publish("CommentRepliedEvent", {
          vibeId,
          commentId: result.value.commentId,
          parentCommentId: parentId,
          replierId: userId,
          targetUserId: result.value.parentAuthorId,
          timestamp: new Date(),
        });
      }

      // 2. Notify post author (if not the commenter and not already notified as parent author)
      if (result.value.authorId !== userId && result.value.authorId !== result.value.parentAuthorId) {
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
