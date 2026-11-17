import { NotificationType } from "@prisma/client";

export interface CreateNotificationDTO {
  userId: string;
  creatorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
  communityId?: string;
}

export interface GetNotificationsOptions {
  limit?: number;
  cursor?: string;
}

export interface PaginatedNotificationsResult {
  notifications: any[];
  nextCursor: string | null;
}

export interface INotificationRepository {
  getNotifications(userId: string, options?: GetNotificationsOptions): Promise<PaginatedNotificationsResult>;
  markAsRead(notificationIds: string[]): Promise<boolean>;
  create(data: CreateNotificationDTO): Promise<any>;
  deleteOldNotifications(daysThreshold?: number): Promise<number>;
}
