import { prisma } from "@/shared/infrastructure/prisma";
import { PrismaOutboxRepository } from "@/modules/outbox/infrastructure/PrismaOutboxRepository";
import { TransactionalOutboxEventBus } from "@/modules/outbox/infrastructure/TransactionalOutboxEventBus";
import { CreateVibeUseCase } from "@/modules/vibe/application/CreateVibe.usecase";
import { PrismaVibeRepository } from "@/modules/vibe/infrastructure/PrismaVibeRepository";
import { OutboxRelayWorker } from "../OutboxRelayWorker";

describe("Outbox End-to-End Integration Flow", () => {
  let outboxRepo: PrismaOutboxRepository;
  let eventBus: TransactionalOutboxEventBus;
  let vibeRepo: PrismaVibeRepository;
  let createVibeUseCase: CreateVibeUseCase;
  let worker: OutboxRelayWorker;
  let testUserId: string;

  beforeAll(async () => {
    outboxRepo = new PrismaOutboxRepository(prisma);
    eventBus = new TransactionalOutboxEventBus(outboxRepo);
    vibeRepo = new PrismaVibeRepository(prisma);
    createVibeUseCase = new CreateVibeUseCase(vibeRepo, eventBus);

    // Create a temporary test user in DB if missing
    const existing = await prisma.user.findFirst();
    if (existing) {
      testUserId = existing.id;
    } else {
      const created = await prisma.user.create({
        data: {
          email: `e2e_outbox_${Date.now()}@vibegrid.tech`,
          username: `e2e_user_${Date.now()}`,
          name: "E2E Outbox User",
        },
      });
      testUserId = created.id;
    }

    worker = new OutboxRelayWorker(outboxRepo, {
      rabbitUrl: process.env.RABBITMQ_URL || "amqp://localhost:5672",
      exchangeName: "domain.events",
      pollIntervalMs: 500,
      batchSize: 10,
      workerId: "e2e_test_relay",
    });
  });

  afterAll(async () => {
    await worker.stop();
    await prisma.outboxEvent.deleteMany({
      where: { aggregateId: { startsWith: "cm" } },
    });
    await prisma.$disconnect();
  });

  it("should perform atomic DB write + Outbox insert, and Relay should publish to RabbitMQ", async () => {
    // 1. Execute UseCase
    const postContent = `E2E Transactional Outbox test ${Date.now()}`;
    const result = await createVibeUseCase.execute(postContent, "", testUserId, ["e2e", "outbox"]);

    expect(result.success).toBe(true);
    if (!result.success) return;
    const createdPostId = result.value.id;

    // 2. Verify OutboxEvent exists in PostgreSQL with status PENDING
    const outboxRecord = await prisma.outboxEvent.findFirst({
      where: { aggregateId: createdPostId, eventType: "vibe.created" },
    });

    expect(outboxRecord).not.toBeNull();
    expect(outboxRecord?.status).toBe("PENDING");
    expect(outboxRecord?.payload).toMatchObject({ vibeId: createdPostId, authorId: testUserId });

    // 3. Mock RabbitMQ channel in worker to simulate broker ACK confirmation
    const mockPublish = jest.fn((ex, key, buf, opts, cb) => cb(null));
    (worker as any).channel = { publish: mockPublish };

    // 4. Run Relay poll cycle
    const relayResult = await worker.pollAndPublish();

    expect(relayResult.claimed).toBeGreaterThanOrEqual(1);
    expect(relayResult.published).toBeGreaterThanOrEqual(1);

    // 5. Verify OutboxEvent transitioned to status PUBLISHED in PostgreSQL
    const updatedRecord = await prisma.outboxEvent.findUnique({
      where: { eventId: outboxRecord!.eventId },
    });

    expect(updatedRecord?.status).toBe("PUBLISHED");
    expect(updatedRecord?.publishedAt).not.toBeNull();
  });
});
