import { prisma } from "@/shared/infrastructure/prisma";
import { PrismaOutboxRepository } from "@/modules/outbox/infrastructure/PrismaOutboxRepository";
import { OutboxRelayWorker } from "./OutboxRelayWorker";

async function main() {
  const outboxRepo = new PrismaOutboxRepository(prisma);
  const worker = new OutboxRelayWorker(outboxRepo, {
    rabbitUrl: process.env.RABBITMQ_URL || "amqp://vibegrid:VgRabbit_MQ2026%23b5%24WvL%212jRx@localhost:5672",
    exchangeName: "domain.events",
    pollIntervalMs: Number(process.env.OUTBOX_POLL_INTERVAL_MS) || 1000,
    batchSize: Number(process.env.OUTBOX_BATCH_SIZE) || 20,
    maxAttempts: Number(process.env.OUTBOX_MAX_ATTEMPTS) || 5,
  });

  await worker.start();

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down Outbox Relay Worker...`);
    await worker.stop();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Fatal error starting Outbox Relay Worker:", err);
  process.exit(1);
});
