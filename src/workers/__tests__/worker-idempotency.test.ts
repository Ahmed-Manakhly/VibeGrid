import { WorkerIdempotencyService } from "../WorkerIdempotencyService";
import { ICacheService } from "@/shared/application/ports/ICacheService";

describe("WorkerIdempotencyService Unit Tests", () => {
  let cacheService: jest.Mocked<ICacheService>;
  let idempotency: WorkerIdempotencyService;

  beforeEach(() => {
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
    idempotency = new WorkerIdempotencyService(cacheService);
  });

  it("should return true on unseen event claim", async () => {
    cacheService.get.mockResolvedValue(null);
    cacheService.acquireLock.mockResolvedValue(true);
    cacheService.set.mockResolvedValue(undefined);

    const claimed = await idempotency.claim("q.timeline.fanout", "evt-100");

    expect(claimed).toBe(true);
    expect(cacheService.acquireLock).toHaveBeenCalled();
  });

  it("should return false on duplicate COMPLETED event claim", async () => {
    cacheService.get.mockResolvedValue("COMPLETED");

    const claimed = await idempotency.claim("q.timeline.fanout", "evt-100");

    expect(claimed).toBe(false);
    expect(cacheService.acquireLock).not.toHaveBeenCalled();
  });

  it("should mark event COMPLETED with retention seconds", async () => {
    await idempotency.complete("q.notifications.push", "evt-200");

    expect(cacheService.set).toHaveBeenCalledWith(
      "idempotency:q.notifications.push:evt-200",
      "COMPLETED",
      604800
    );
  });

  it("should release claim on worker failure", async () => {
    await idempotency.release("q.search.indexing", "evt-300");

    expect(cacheService.delete).toHaveBeenCalledWith(
      "idempotency:q.search.indexing:evt-300"
    );
  });
});
