import { INotificationRepository, GetNotificationsOptions, PaginatedNotificationsResult } from "../domain/INotificationRepository";

export class GetNotificationsUseCase {
  constructor(private repo: INotificationRepository) {}

  async execute(userId: string, options?: GetNotificationsOptions): Promise<PaginatedNotificationsResult> {
    if (!userId) return { notifications: [], nextCursor: null };
    return this.repo.getNotifications(userId, options);
  }
}
