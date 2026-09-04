import { PrismaClient } from "@prisma/client";
import { IOutboxRepository } from "../domain/IOutboxRepository";
import { OutboxEvent, OutboxStatus } from "../domain/OutboxEvent";

export class PrismaOutboxRepository implements IOutboxRepository {
  constructor(private prisma: PrismaClient) {}

  public async append(event: OutboxEvent, tx?: any): Promise<void> {
    const db = tx || this.prisma;
    await db.outboxEvent.create({
      data: {
        eventId: event.eventId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload,
        occurredAt: event.occurredAt,
        status: event.status as any,
        attempts: event.attempts,
        availableAt: event.availableAt,
      },
    });
  }

  public async claimBatch(batchSize: number, lockOwner: string, leaseMs: number): Promise<OutboxEvent[]> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Raw SQL query using FOR UPDATE SKIP LOCKED for high-concurrency atomic row claiming
      const rawRows: Array<{ id: string }> = await tx.$queryRaw`
        SELECT "id" FROM "OutboxEvent"
        WHERE ("status" = 'PENDING' OR ("status" = 'FAILED' AND "attempts" < 5))
          AND "availableAt" <= NOW()
        ORDER BY "createdAt" ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      `;

      if (!rawRows || rawRows.length === 0) {
        return [];
      }

      const targetIds = rawRows.map((r) => r.id);

      // 2. Mark claimed rows atomically
      await tx.outboxEvent.updateMany({
        where: { id: { in: targetIds } },
        data: {
          status: "CLAIMED",
          claimedBy: lockOwner,
          updatedAt: new Date(),
        },
      });

      // 3. Retrieve claimed entities
      const records = await tx.outboxEvent.findMany({
        where: { id: { in: targetIds } },
      });

      return records.map(
        (r) =>
          new OutboxEvent({
            id: r.id,
            eventId: r.eventId,
            eventType: r.eventType,
            aggregateType: r.aggregateType,
            aggregateId: r.aggregateId,
            payload: r.payload as Record<string, any>,
            occurredAt: r.occurredAt,
            status: r.status as OutboxStatus,
            attempts: r.attempts,
            availableAt: r.availableAt,
            publishedAt: r.publishedAt,
            lastError: r.lastError,
            claimedBy: r.claimedBy,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })
      );
    });
  }

  public async markPublished(eventIds: string[]): Promise<void> {
    if (!eventIds || eventIds.length === 0) return;
    await this.prisma.outboxEvent.updateMany({
      where: { eventId: { in: eventIds } },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        claimedBy: null,
      },
    });
  }

  public async markFailed(
    eventId: string,
    error: string,
    availableAt: Date,
    isMaxAttempts: boolean
  ): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { eventId },
      data: {
        attempts: { increment: 1 },
        lastError: error.substring(0, 1000),
        availableAt,
        status: isMaxAttempts ? "FAILED" : "PENDING",
        claimedBy: null,
      },
    });
  }

  public async releaseLease(lockOwner: string): Promise<void> {
    await this.prisma.outboxEvent.updateMany({
      where: { claimedBy: lockOwner, status: "CLAIMED" },
      data: {
        status: "PENDING",
        claimedBy: null,
      },
    });
  }
}
