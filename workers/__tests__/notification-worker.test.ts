import { NotificationWorker } from "../NotificationWorker";
import { INotificationRepository } from "@/modules/notification/domain/INotificationRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";

describe("NotificationWorker Unit Tests", () => {
  let notificationRepo: jest.Mocked<INotificationRepository>;
  let cacheService: jest.Mocked<ICacheService>;
  let worker: NotificationWorker;

  beforeEach(() => {
    notificationRepo = {
      getNotifications: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      deleteNotification: jest.fn(),
      create: jest.fn(),
      deleteOldNotifications: jest.fn(),
    };

    cacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      getOrSet: jest.fn(),
      acquireLock: jest.fn(),
      releaseLock: jest.fn(),
      rateLimit: jest.fn(),
    };

    worker = new NotificationWorker(notificationRepo, cacheService, {
      rabbitUrl: "amqp://localhost",
    });
  });

  it("should persist follow notification when user is followed", async () => {
    notificationRepo.create.mockResolvedValue({ id: "notif_1" });

    await (worker as any).processNotification({
      eventName: "user.followed",
      payload: { followingId: "target_user", followerId: "actor_user" },
    });

    expect(notificationRepo.create).toHaveBeenCalledWith({
      userId: "target_user",
      creatorId: "actor_user",
      type: "FOLLOW",
      postId: undefined,
      commentId: undefined,
    });
  });

  it("should ignore self-notifications", async () => {
    await (worker as any).processNotification({
      eventName: "like.toggled",
      payload: { authorId: "same_user", likerId: "same_user", vibeId: "post_1" },
    });

    expect(notificationRepo.create).not.toHaveBeenCalled();
  });
});
