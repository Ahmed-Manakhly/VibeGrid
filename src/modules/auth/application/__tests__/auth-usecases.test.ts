import { SyncUserUseCase } from "../SyncUser.usecase";
import { GetUserUseCase } from "../GetUser.usecase";
import { ChangePasswordUseCase } from "../ChangePassword.usecase";
import { IAuthRepository } from "../../domain/IAuthRepository";
import * as authClient from "@/lib/auth/auth.client";

jest.mock("@/lib/auth/auth.client", () => ({
  authServiceFetch: jest.fn(),
}));

describe("Auth Module Application Use Cases", () => {
  let mockRepo: jest.Mocked<IAuthRepository>;

  beforeEach(() => {
    mockRepo = {
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
    } as any;
    jest.clearAllMocks();
  });

  describe("SyncUserUseCase", () => {
    it("should return null if userId or user payload is missing", async () => {
      const useCase = new SyncUserUseCase(mockRepo);
      expect(await useCase.execute("", null)).toBeNull();
      expect(mockRepo.getUserById).not.toHaveBeenCalled();
    });

    it("should return existing user without creating a new record", async () => {
      const existing = { id: "u1", name: "Alice", username: "alice", email: "alice@test.com" };
      mockRepo.getUserById.mockResolvedValue(existing as any);

      const useCase = new SyncUserUseCase(mockRepo);
      const result = await useCase.execute("u1", { email: "alice@test.com" });

      expect(result).toEqual(existing);
      expect(mockRepo.createUser).not.toHaveBeenCalled();
    });

    it("should create user with derived username if username is not provided", async () => {
      mockRepo.getUserById.mockResolvedValue(null);
      mockRepo.createUser.mockResolvedValue({
        id: "u2",
        name: "bob",
        username: "bob",
        email: "bob@vibegrid.tech",
        image: null,
      } as any);

      const useCase = new SyncUserUseCase(mockRepo);
      const result = await useCase.execute("u2", { email: "bob@vibegrid.tech" });

      expect(mockRepo.createUser).toHaveBeenCalledWith({
        id: "u2",
        name: "bob",
        username: "bob",
        email: "bob@vibegrid.tech",
        image: null,
      });
      expect(result?.username).toBe("bob");
    });
  });

  describe("GetUserUseCase", () => {
    it("should return null if userId is empty", async () => {
      const useCase = new GetUserUseCase(mockRepo);
      expect(await useCase.execute("")).toBeNull();
    });

    it("should retrieve user by ID", async () => {
      const user = { id: "u1", name: "Charlie" };
      mockRepo.getUserById.mockResolvedValue(user as any);

      const useCase = new GetUserUseCase(mockRepo);
      const result = await useCase.execute("u1");

      expect(result).toEqual(user);
    });

    it("getDbUserId should throw if user not found", async () => {
      mockRepo.getUserById.mockResolvedValue(null);
      const useCase = new GetUserUseCase(mockRepo);

      await expect(useCase.getDbUserId("invalid_id")).rejects.toThrow("user not found!");
    });

    it("getDbUserId should return user ID when found", async () => {
      mockRepo.getUserById.mockResolvedValue({ id: "u123" } as any);
      const useCase = new GetUserUseCase(mockRepo);

      const dbId = await useCase.getDbUserId("u123");
      expect(dbId).toBe("u123");
    });
  });

  describe("ChangePasswordUseCase", () => {
    it("should reject if current or new password is empty", async () => {
      const useCase = new ChangePasswordUseCase();
      const res = await useCase.execute("", "newpass", "token");

      expect(res.success).toBe(false);
      expect(res.error).toContain("required");
    });

    it("should call authServiceFetch and return success on ok response", async () => {
      (authClient.authServiceFetch as jest.Mock).mockResolvedValue({
        ok: true,
        data: { status: "success", data: { message: "Password updated successfully" } },
      });

      const useCase = new ChangePasswordUseCase();
      const res = await useCase.execute("oldpass123", "newpass123", "token123");

      expect(res.success).toBe(true);
      expect(res.message).toBe("Password updated successfully");
    });

    it("should handle error response from authServiceFetch", async () => {
      (authClient.authServiceFetch as jest.Mock).mockResolvedValue({
        ok: false,
        data: { message: "Current password invalid" },
      });

      const useCase = new ChangePasswordUseCase();
      const res = await useCase.execute("wrongpass", "newpass123", "token123");

      expect(res.success).toBe(false);
      expect(res.error).toBe("Current password invalid");
    });
  });
});
