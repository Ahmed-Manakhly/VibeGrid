import { INotificationRepository } from "../domain/INotificationRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";
import { NotificationType } from "@prisma/client";

export class NotificationEventHandler {
  constructor(private repo: INotificationRepository, private eventBus: IEventBus) {
    this.setupListeners();
  }

  private setupListeners() {
    this.eventBus.subscribe("LikeToggledEvent", async (payload: any) => {
      // Create a LIKE notification for the author
      try {
        await this.repo.create({
          userId: payload.authorId,
          creatorId: payload.likerId,
          type: NotificationType.LIKE,
          postId: payload.vibeId,
        });
        console.log(`[NotificationEventHandler] LIKE notification created for user ${payload.authorId}`);
      } catch (error) {
        console.error("[NotificationEventHandler] Error creating LIKE notification", error);
      }
    });

    this.eventBus.subscribe("CommentAddedEvent", async (payload: any) => {
      // Create a COMMENT notification for the author
      try {
        await this.repo.create({
          userId: payload.authorId,
          creatorId: payload.commenterId,
          type: NotificationType.COMMENT,
          postId: payload.vibeId,
          commentId: payload.commentId,
        });
        console.log(`[NotificationEventHandler] COMMENT notification created for user ${payload.authorId}`);
      } catch (error) {
        console.error("[NotificationEventHandler] Error creating COMMENT notification", error);
      }
    });

    this.eventBus.subscribe("UserFollowedEvent", async (payload: any) => {
      // Create a FOLLOW notification for the user being followed
      try {
        await this.repo.create({
          userId: payload.followingId,
          creatorId: payload.followerId,
          type: NotificationType.FOLLOW,
        });
        console.log(`[NotificationEventHandler] FOLLOW notification created for user ${payload.followingId}`);
      } catch (error) {
        console.error("[NotificationEventHandler] Error creating FOLLOW notification", error);
      }
    });
  }
}
