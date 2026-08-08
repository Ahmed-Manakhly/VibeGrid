import { INotificationRepository } from "../domain/INotificationRepository";

export class GetNotificationsUseCase {
  constructor(private repo: INotificationRepository) {}

  async execute(userId: string) {
    if (!userId) return [];
    return this.repo.getNotifications(userId);
  }
}
