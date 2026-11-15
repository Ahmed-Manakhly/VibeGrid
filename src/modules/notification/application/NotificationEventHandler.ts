import { INotificationRepository } from "../domain/INotificationRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { NotificationType } from "@prisma/client";

export class NotificationEventHandler {
  constructor(
    private repo: INotificationRepository,
    private eventBus: IEventBus,
    private cacheService?: ICacheService
  ) {
    this.setupListeners();
  }

  private async dispatchRealtime(userId: string, notification: any) {
    if (this.cacheService && typeof (this.cacheService as any).publish === "function") {
      try {
        const payload = JSON.stringify({
          userId,
          notification: {
            id: notification.id,
            type: notification.type,
            userId: notification.userId,
            creatorId: notification.creatorId,
            postId: notification.postId,
            commentId: notification.commenttId || notification.commentId,
            isRead: notification.read,
            createdAt: notification.createdAt ? new Date(notification.createdAt).toISOString() : new Date().toISOString(),
          },
        });
        await (this.cacheService as any).publish("realtime:notification", payload);
      } catch (err) {
        // Non-blocking
      }
    }
  }

  private setupListeners() {
    this.eventBus.subscribe("LikeToggledEvent", async (payload: any) => {
      // Create a LIKE notification for the author
      try {
        const created = await this.repo.create({
          userId: payload.authorId,
          creatorId: payload.likerId,
          type: NotificationType.LIKE,
          postId: payload.vibeId,
        });
        await this.dispatchRealtime(payload.authorId, created);
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.info(`[NotificationEventHandler] LIKE notification created and emitted for user ${payload.authorId}`);
      } catch (error) {
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.error("[NotificationEventHandler] Error creating LIKE notification", error);
      }
    });

    this.eventBus.subscribe("CommentAddedEvent", async (payload: any) => {
      // Create a COMMENT notification for the author
      try {
        const created = await this.repo.create({
          userId: payload.authorId,
          creatorId: payload.commenterId,
          type: NotificationType.COMMENT,
          postId: payload.vibeId,
          commentId: payload.commentId,
        });
        await this.dispatchRealtime(payload.authorId, created);
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.info(`[NotificationEventHandler] COMMENT notification created and emitted for user ${payload.authorId}`);
      } catch (error) {
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.error("[NotificationEventHandler] Error creating COMMENT notification", error);
      }
    });

    this.eventBus.subscribe("UserFollowedEvent", async (payload: any) => {
      // Create a FOLLOW notification for the user being followed
      try {
        const created = await this.repo.create({
          userId: payload.followingId,
          creatorId: payload.followerId,
          type: NotificationType.FOLLOW,
        });
        await this.dispatchRealtime(payload.followingId, created);
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.info(`[NotificationEventHandler] FOLLOW notification created and emitted for user ${payload.followingId}`);
      } catch (error) {
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.error("[NotificationEventHandler] Error creating FOLLOW notification", error);
      }
    });
  }
}


