import { OutboxRelayWorker } from "../OutboxRelayWorker";
import { IOutboxRepository } from "@/modules/outbox/domain/IOutboxRepository";
import { OutboxEvent } from "@/modules/outbox/domain/OutboxEvent";

describe("OutboxRelayWorker Unit Tests", () => {
  let mockRepo: jest.Mocked<IOutboxRepository>;
  let worker: OutboxRelayWorker;

  beforeEach(() => {
    mockRepo = {
      append: jest.fn().mockResolvedValue(undefined),
      claimBatch: jest.fn().mockResolvedValue([]),
      markPublished: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
      releaseLease: jest.fn().mockResolvedValue(undefined),
    };

    worker = new OutboxRelayWorker(mockRepo, {
      rabbitUrl: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
      exchangeName: "domain.events.test",
      pollIntervalMs: 100,
      batchSize: 5,
      maxAttempts: 3,
      workerId: "test_worker_unit",
    });
  });

  afterEach(async () => {
    await worker.stop();
  });

  it("should return zero metrics when no pending outbox events exist", async () => {
    // Mock channel to avoid connecting to RabbitMQ in pure unit test
    (worker as any).channel = {
      publish: jest.fn((ex, key, buf, opts, cb) => cb(null)),
    };

    const result = await worker.pollAndPublish();

    expect(result).toEqual({ claimed: 0, published: 0, failed: 0 });
    expect(mockRepo.claimBatch).toHaveBeenCalledWith(5, "test_worker_unit", 30000);
  });

  it("should claim batch and publish events with publisher confirmation", async () => {
    const testEvents = [
      new OutboxEvent({
        eventId: "evt_claim_1",
        eventType: "user.registered",
        aggregateType: "User",
        aggregateId: "u100",
        payload: { email: "unit@vibegrid.tech" },
      }),
    ];

    mockRepo.claimBatch.mockResolvedValue(testEvents);

    const mockPublish = jest.fn((ex, key, buf, opts, cb) => {
      cb(null); // ACK publisher confirmation
    });

    (worker as any).channel = { publish: mockPublish };

    const result = await worker.pollAndPublish();

    expect(result.claimed).toBe(1);
    expect(result.published).toBe(1);
    expect(mockRepo.markPublished).toHaveBeenCalledWith(["evt_claim_1"]);
  });

  it("should handle RabbitMQ publish error and mark event failed with backoff", async () => {
    const testEvents = [
      new OutboxEvent({
        eventId: "evt_fail_1",
        eventType: "vibe.created",
        aggregateType: "Post",
        aggregateId: "p100",
        payload: { content: "Fail test" },
        attempts: 0,
      }),
    ];

    mockRepo.claimBatch.mockResolvedValue(testEvents);

    const mockPublish = jest.fn((ex, key, buf, opts, cb) => {
      cb(new Error("RabbitMQ Channel NACK"));
    });

    (worker as any).channel = { publish: mockPublish };

    const result = await worker.pollAndPublish();

    expect(result.claimed).toBe(1);
    expect(result.failed).toBe(1);
    expect(mockRepo.markFailed).toHaveBeenCalledWith(
      "evt_fail_1",
      expect.stringContaining("RabbitMQ ACK failed: RabbitMQ Channel NACK"),
      expect.any(Date),
      false
    );
  });

  it("should track metrics accurately", () => {
    const metrics = worker.getMetrics();
    expect(metrics.workerId).toBe("test_worker_unit");
    expect(metrics.isRunning).toBe(false);
    expect(metrics.totalClaimed).toBe(0);
  });
});
