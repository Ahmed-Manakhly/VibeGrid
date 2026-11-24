import { GetNotificationsUseCase } from "../GetNotifications.usecase";
import { MarkAsReadUseCase } from "../MarkAsRead.usecase";
import { INotificationRepository } from "../../domain/INotificationRepository";

describe("Notification Module Use Cases", () => {
  let mockRepo: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      getNotifications: jest.fn(),
      markAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
    } as any;
  });

  describe("GetNotificationsUseCase", () => {
    it("should return empty list if userId is not provided", async () => {
      const useCase = new GetNotificationsUseCase(mockRepo);
      const result = await useCase.execute("");

      expect(result).toEqual({ notifications: [], nextCursor: null });
      expect(mockRepo.getNotifications).not.toHaveBeenCalled();
    });

    it("should fetch paginated notifications for valid userId", async () => {
      const mockResult = {
        notifications: [
          {
            id: "notif_1",
            userId: "u1",
            creatorId: "u2",
            type: "LIKE" as any,
            isRead: false,
            createdAt: new Date(),
          },
        ],
        nextCursor: "cursor_123",
      };
      mockRepo.getNotifications.mockResolvedValue(mockResult);

      const useCase = new GetNotificationsUseCase(mockRepo);
      const result = await useCase.execute("u1", { limit: 10 });

      expect(mockRepo.getNotifications).toHaveBeenCalledWith("u1", { limit: 10 });
      expect(result.notifications).toHaveLength(1);
      expect(result.nextCursor).toBe("cursor_123");
    });

    it("should return unread count correctly", async () => {
      mockRepo.getUnreadCount.mockResolvedValue(5);

      const useCase = new GetNotificationsUseCase(mockRepo);
      const count = await useCase.getUnreadCount("u1");

      expect(mockRepo.getUnreadCount).toHaveBeenCalledWith("u1");
      expect(count).toBe(5);
    });

    it("should return 0 unread count if userId is empty", async () => {
      const useCase = new GetNotificationsUseCase(mockRepo);
      const count = await useCase.getUnreadCount("");

      expect(count).toBe(0);
      expect(mockRepo.getUnreadCount).not.toHaveBeenCalled();
    });
  });

  describe("MarkAsReadUseCase", () => {
    it("should return success true immediately if notificationIds is empty", async () => {
      const useCase = new MarkAsReadUseCase(mockRepo);
      const result = await useCase.execute([]);

      expect(result).toEqual({ success: true });
      expect(mockRepo.markAsRead).not.toHaveBeenCalled();
    });

    it("should call repository with notification IDs and return result", async () => {
      mockRepo.markAsRead.mockResolvedValue(true);

      const useCase = new MarkAsReadUseCase(mockRepo);
      const result = await useCase.execute(["n1", "n2"]);

      expect(mockRepo.markAsRead).toHaveBeenCalledWith(["n1", "n2"]);
      expect(result).toEqual({ success: true });
    });
  });
});
