import { INotificationRepository } from "../domain/INotificationRepository";

export class MarkAsReadUseCase {
  constructor(private repo: INotificationRepository) {}

  async execute(notificationIds: string[]) {
    if (!notificationIds || notificationIds.length === 0) return { success: true };
    const success = await this.repo.markAsRead(notificationIds);
    return { success };
  }
}
