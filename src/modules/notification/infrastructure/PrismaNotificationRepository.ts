import { INotificationRepository, CreateNotificationDTO } from "../domain/INotificationRepository";
import { PrismaClient } from "@prisma/client";

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private db: PrismaClient) {}

  async getNotifications(userId: string): Promise<any[]> {
    try {
      const notifications = await this.db.notifications.findMany({
        where: { userId },
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
        },
        orderBy: { createdAt: "desc" },
      });
      return notifications;
    } catch (error) {
      const { logger } = require("@/shared/infrastructure/di-container");
      logger.error("[PrismaNotificationRepository] Error fetching notifications", error);
      throw new Error("Failed to fetch notifications");
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
      },
    });
  }
}
