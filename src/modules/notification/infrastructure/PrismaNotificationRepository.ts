import { INotificationRepository, CreateNotificationDTO, GetNotificationsOptions, PaginatedNotificationsResult } from "../domain/INotificationRepository";
import { PrismaClient } from "@prisma/client";

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private db: PrismaClient) {}

  async getNotifications(userId: string, options?: GetNotificationsOptions): Promise<PaginatedNotificationsResult> {
    try {
      const limit = options?.limit || 20;
      const cursor = options?.cursor;

      const notifications = await this.db.notifications.findMany({
        where: { userId },
        take: limit + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        include: {
          creator: {
            select: { id: true, name: true, username: true, image: true },
          },
          post: {
            select: { id: true, content: true, mediaUrl: true, mediaType: true },
          },
          comment: {
            select: { id: true, content: true, createdAt: true },
          },
          community: {
            select: { id: true, name: true, slug: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | null = null;
      if (notifications.length > limit) {
        const nextItem = notifications.pop();
        nextCursor = nextItem?.id || null;
      }

      return {
        notifications,
        nextCursor,
      };
    } catch (error) {
      const { logger } = require("@/shared/infrastructure/di-container");
      logger.error("[PrismaNotificationRepository] Error fetching notifications", error);
      throw new Error("Failed to fetch notifications");
    }
  }

  async deleteOldNotifications(daysThreshold = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

      const deleteResult = await this.db.notifications.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      return deleteResult.count;
    } catch (error) {
      const { logger } = require("@/shared/infrastructure/di-container");
      logger.error("[PrismaNotificationRepository] Error pruning old notifications", error);
      return 0;
    }
  }

  async markAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      await this.db.notifications.updateMany({
        where: { id: { in: notificationIds } },
        data: { read: true },
      });
      return true;
    } catch (error) {
      const { logger } = require("@/shared/infrastructure/di-container");
      logger.error("[PrismaNotificationRepository] Error marking notifications as read", error);
      return false;
    }
  }

  async create(data: CreateNotificationDTO): Promise<any> {
    return this.db.notifications.create({
      data: {
        userId: data.userId,
        creatorId: data.creatorId,
        type: data.type,
        postId: data.postId,
        commenttId: data.commentId,
        communityId: data.communityId,
      },
    });
  }
}
