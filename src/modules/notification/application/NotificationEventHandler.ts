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
        let creatorName = undefined;
        let creatorUsername = undefined;
        if (notification.creator) {
          creatorName = notification.creator.name;
          creatorUsername = notification.creator.username;
        } else if (notification.creatorId) {
          try {
            const { prisma } = require("@/shared/infrastructure/di-container");
            const creator = await prisma.user.findUnique({
              where: { id: notification.creatorId },
              select: { name: true, username: true },
            });
            if (creator) {
              creatorName = creator.name;
              creatorUsername = creator.username;
            }
          } catch {
            // Ignore optional name resolution
          }
        }

        const payload = JSON.stringify({
          userId,
          notification: {
            id: notification.id,
            type: notification.type,
            userId: notification.userId,
            creatorId: notification.creatorId,
            creatorName,
            creatorUsername,
            postId: notification.postId,
            commentId: notification.commenttId || notification.commentId,
            communityId: notification.communityId,
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
      // Create a LIKE notification for author (skip if self-like)
      try {
        if (!payload.authorId || !payload.likerId || payload.authorId === payload.likerId) {
          return;
        }
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
      // Create a COMMENT notification for the author (skip if self-comment)
      try {
        if (!payload.authorId || !payload.commenterId || payload.authorId === payload.commenterId) {
          return;
        }
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

    this.eventBus.subscribe("CommentRepliedEvent", async (payload: any) => {
      // Create a REPLY notification for the parent comment author (skip if self-reply)
      try {
        if (!payload.targetUserId || !payload.replierId || payload.targetUserId === payload.replierId) {
          return;
        }
        const created = await this.repo.create({
          userId: payload.targetUserId,
          creatorId: payload.replierId,
          type: NotificationType.REPLY,
          postId: payload.vibeId,
          commentId: payload.commentId,
        });
        await this.dispatchRealtime(payload.targetUserId, created);
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.info(`[NotificationEventHandler] REPLY notification created and emitted for user ${payload.targetUserId}`);
      } catch (error) {
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.error("[NotificationEventHandler] Error creating REPLY notification", error);
      }
    });

    this.eventBus.subscribe("ReGridCreatedEvent", async (payload: any) => {
      // Create a REGRID notification for the post author (skip if self-regrid)
      try {
        if (!payload.authorId || !payload.regridderId || payload.authorId === payload.regridderId) {
          return;
        }
        const created = await this.repo.create({
          userId: payload.authorId,
          creatorId: payload.regridderId,
          type: NotificationType.REGRID,
          postId: payload.vibeId,
        });
        await this.dispatchRealtime(payload.authorId, created);
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.info(`[NotificationEventHandler] REGRID notification created and emitted for user ${payload.authorId}`);
      } catch (error) {
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.error("[NotificationEventHandler] Error creating REGRID notification", error);
      }
    });

    this.eventBus.subscribe("UserFollowedEvent", async (payload: any) => {
      // Create a FOLLOW notification for the user being followed (skip if self-follow)
      try {
        if (!payload.followingId || !payload.followerId || payload.followingId === payload.followerId) {
          return;
        }
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

    this.eventBus.subscribe("CommunityJoinedEvent", async (payload: any) => {
      // Create a COMMUNITY_JOIN notification for the community creator / admins
      try {
        if (!payload.targetUserId || !payload.joinerId || payload.targetUserId === payload.joinerId) {
          return;
        }
        const created = await this.repo.create({
          userId: payload.targetUserId,
          creatorId: payload.joinerId,
          type: NotificationType.COMMUNITY_JOIN,
          communityId: payload.communityId,
        });
        await this.dispatchRealtime(payload.targetUserId, created);
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.info(`[NotificationEventHandler] COMMUNITY_JOIN notification created for user ${payload.targetUserId}`);
      } catch (error) {
        const { logger } = require("@/shared/infrastructure/di-container");
        logger.error("[NotificationEventHandler] Error creating COMMUNITY_JOIN notification", error);
      }
    });
  }
}


