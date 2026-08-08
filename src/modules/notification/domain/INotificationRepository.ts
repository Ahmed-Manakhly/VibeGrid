import { NotificationType } from "@prisma/client";

export interface CreateNotificationDTO {
  userId: string;
  creatorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
}

export interface INotificationRepository {
  getNotifications(userId: string): Promise<any[]>;
  markAsRead(notificationIds: string[]): Promise<boolean>;
  create(data: CreateNotificationDTO): Promise<any>;
}
