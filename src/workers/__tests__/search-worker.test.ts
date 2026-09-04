import { SearchIndexWorker } from "../SearchIndexWorker";
import { PrismaClient } from "@prisma/client";
import { ICacheService } from "@/shared/application/ports/ICacheService";

describe("SearchIndexWorker Unit Tests", () => {
  let prismaMock: any;
  let cacheService: jest.Mocked<ICacheService>;
  let worker: SearchIndexWorker;

  beforeEach(() => {
    prismaMock = {
      post: { findUnique: jest.fn() },
      user: { findUnique: jest.fn() },
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

    worker = new SearchIndexWorker(prismaMock as any, cacheService, {
      rabbitUrl: "amqp://localhost",
    });
  });

  it("should index post with upsert semantics", async () => {
    prismaMock.post.findUnique.mockResolvedValue({
      id: "post_500",
      content: "Tech news post",
      author: { name: "Alex Rivera", username: "alex_rivera" },
      category: { name: "Tech" },
      vibe: { name: "Coding" },
      tags: [{ tag: { name: "TypeScript" } }],
    });

    await (worker as any).processIndex({
      eventName: "vibe.created",
      payload: { vibeId: "post_500" },
    });

    expect(prismaMock.post.findUnique).toHaveBeenCalledWith({
      where: { id: "post_500" },
      include: { author: true, category: true, vibe: true, tags: { include: { tag: true } } },
    });

    expect(cacheService.set).toHaveBeenCalledWith(
      "search:post:post_500",
      expect.objectContaining({ id: "post_500", type: "post", content: "Tech news post" }),
      2592000
    );
  });
});
