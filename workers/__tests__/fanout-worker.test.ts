import { FanOutWorker } from "../FanOutWorker";
import { ISocialRepository } from "@/modules/social/domain/ISocialRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";

describe("FanOutWorker Unit & Hybrid Strategy Tests", () => {
  let socialRepo: jest.Mocked<ISocialRepository>;
  let cacheService: jest.Mocked<ICacheService>;
  let worker: FanOutWorker;

  beforeEach(() => {
    socialRepo = {
      getSuggestedUsers: jest.fn(),
      getFollow: jest.fn(),
      addFollow: jest.fn(),
      removeFollow: jest.fn(),
      getFollowerIds: jest.fn(),
      searchUsers: jest.fn(),
      getFollowingIds: jest.fn(),
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

    worker = new FanOutWorker(socialRepo, cacheService, {
      rabbitUrl: "amqp://localhost",
      hybridThreshold: 5,
    });
  });

  it("should push post to follower feed cache when follower count is below threshold", async () => {
    socialRepo.getFollowerIds.mockResolvedValue(["follower_1", "follower_2"]);
    cacheService.get.mockResolvedValue([]);

    await (worker as any).processFanOut({
      eventName: "vibe.created",
      payload: { authorId: "author_1", vibeId: "post_100" },
    });

    expect(socialRepo.getFollowerIds).toHaveBeenCalledWith("author_1");
    expect(cacheService.set).toHaveBeenCalledWith("timeline:follower_1", ["post_100"], 86400);
    expect(cacheService.set).toHaveBeenCalledWith("timeline:follower_2", ["post_100"], 86400);
  });

  it("should skip push fan-out when follower count meets or exceeds hybrid threshold", async () => {
    socialRepo.getFollowerIds.mockResolvedValue(["f1", "f2", "f3", "f4", "f5"]);

    await (worker as any).processFanOut({
      eventName: "vibe.created",
      payload: { authorId: "celeb_author", vibeId: "post_200" },
    });

    expect(cacheService.set).not.toHaveBeenCalled();
  });
});
