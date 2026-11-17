import { NotificationTTLPrunerWorker } from "../NotificationTTLPrunerWorker";
import { INotificationRepository } from "@/modules/notification/domain/INotificationRepository";

describe("NotificationTTLPrunerWorker Unit & Lifecycle Test", () => {
  let mockNotificationRepo: jest.Mocked<INotificationRepository>;
  let prunerWorker: NotificationTTLPrunerWorker;

  beforeEach(() => {
    mockNotificationRepo = {
      getNotifications: jest.fn(),
      markAsRead: jest.fn(),
      create: jest.fn(),
      deleteOldNotifications: jest.fn().mockResolvedValue(15),
    };

    prunerWorker = new NotificationTTLPrunerWorker(mockNotificationRepo, {
      intervalMs: 100000,
      daysThreshold: 30,
    });
  });

  afterEach(() => {
    prunerWorker.stop();
  });

  it("should trigger deleteOldNotifications with 30-day threshold", async () => {
    const pruned = await prunerWorker.prune();

    expect(pruned).toBe(15);
    expect(mockNotificationRepo.deleteOldNotifications).toHaveBeenCalledWith(30);
  });

  it("should gracefully handle repository exceptions during prune", async () => {
    mockNotificationRepo.deleteOldNotifications.mockRejectedValueOnce(new Error("Database connection timeout"));

    const pruned = await prunerWorker.prune();

    expect(pruned).toBe(0);
  });
});

