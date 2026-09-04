import { prisma } from "@/shared/infrastructure/prisma";
import { PrismaOutboxRepository } from "../infrastructure/PrismaOutboxRepository";
import { OutboxEvent } from "../domain/OutboxEvent";
import crypto from "crypto";

describe("PrismaOutboxRepository Integration Tests", () => {
  let repository: PrismaOutboxRepository;

  beforeAll(() => {
    repository = new PrismaOutboxRepository(prisma);
  });

  afterEach(async () => {
    await prisma.outboxEvent.deleteMany({
      where: { eventId: { startsWith: "test_evt_" } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should append outbox event inside an active Prisma transaction", async () => {
    const eventId = `test_evt_${crypto.randomUUID()}`;
    const event = new OutboxEvent({
      eventId,
      eventType: "vibe.created",
      aggregateType: "Post",
      aggregateId: "post_test_1",
      payload: { content: "Transactional outbox test" },
    });

    await prisma.$transaction(async (tx) => {
      await repository.append(event, tx);
    });

    const record = await prisma.outboxEvent.findUnique({
      where: { eventId },
    });

    expect(record).not.toBeNull();
    expect(record?.eventType).toBe("vibe.created");
    expect(record?.status).toBe("PENDING");
  });

  it("should claim batch atomically using FOR UPDATE SKIP LOCKED and set claimedBy", async () => {
    const eventId1 = `test_evt_${crypto.randomUUID()}`;
    const eventId2 = `test_evt_${crypto.randomUUID()}`;

    await repository.append(
      new OutboxEvent({
        eventId: eventId1,
        eventType: "user.followed",
        aggregateType: "User",
        aggregateId: "u1",
        payload: { followerId: "u1", followingId: "u2" },
      })
    );

    await repository.append(
      new OutboxEvent({
        eventId: eventId2,
        eventType: "like.toggled",
        aggregateType: "Post",
        aggregateId: "p1",
        payload: { likerId: "u1" },
      })
    );

    const claimed = await repository.claimBatch(10, "worker_test_1", 30000);

    expect(claimed.length).toBeGreaterThanOrEqual(2);
    const c1 = claimed.find((e) => e.eventId === eventId1);
    const c2 = claimed.find((e) => e.eventId === eventId2);

    expect(c1).toBeDefined();
    expect(c2).toBeDefined();
    expect(c1?.claimedBy).toBe("worker_test_1");
  });

  it("should mark published events cleanly", async () => {
    const eventId = `test_evt_${crypto.randomUUID()}`;
    await repository.append(
      new OutboxEvent({
        eventId,
        eventType: "comment.added",
        aggregateType: "Comment",
        aggregateId: "c1",
        payload: { text: "Mark published test" },
      })
    );

    await repository.markPublished([eventId]);

    const record = await prisma.outboxEvent.findUnique({ where: { eventId } });
    expect(record?.status).toBe("PUBLISHED");
    expect(record?.publishedAt).not.toBeNull();
  });

  it("should mark failed event with error message and retry availableAt", async () => {
    const eventId = `test_evt_${crypto.randomUUID()}`;
    await repository.append(
      new OutboxEvent({
        eventId,
        eventType: "user.registered",
        aggregateType: "User",
        aggregateId: "u_fail",
        payload: { email: "fail@test.com" },
      })
    );

    const nextAvailable = new Date(Date.now() + 5000);
    await repository.markFailed(eventId, "RabbitMQ Timeout", nextAvailable, false);

    const record = await prisma.outboxEvent.findUnique({ where: { eventId } });
    expect(record?.attempts).toBe(1);
    expect(record?.lastError).toBe("RabbitMQ Timeout");
    expect(record?.status).toBe("PENDING");
  });
});
