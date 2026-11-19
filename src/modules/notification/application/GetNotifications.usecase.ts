import { INotificationRepository, GetNotificationsOptions, PaginatedNotificationsResult } from "../domain/INotificationRepository";

export class GetNotificationsUseCase {
  constructor(private repo: INotificationRepository) {}

  async execute(userId: string, options?: GetNotificationsOptions): Promise<PaginatedNotificationsResult> {
    if (!userId) return { notifications: [], nextCursor: null };
    return this.repo.getNotifications(userId, options);
  }

  async getUnreadCount(userId: string): Promise<number> {
    if (!userId) return 0;
    if (typeof this.repo.getUnreadCount === "function") {
      return this.repo.getUnreadCount(userId);
    }
    return 0;
  }
}
