import { INotificationRepository } from "../domain/INotificationRepository";
import { DomainEventBus } from "@/shared/infrastructure/EventBus";
import { NotificationType } from "@prisma/client";

export class NotificationEventHandler {
  constructor(private repo: INotificationRepository) {
    this.setupListeners();
  }

  private setupListeners() {
    DomainEventBus.subscribe("LikeToggledEvent", async (payload: any) => {
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

    DomainEventBus.subscribe("CommentAddedEvent", async (payload: any) => {
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

    DomainEventBus.subscribe("UserFollowedEvent", async (payload: any) => {
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
