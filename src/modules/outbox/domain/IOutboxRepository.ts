import { OutboxEvent } from "./OutboxEvent";

export interface IOutboxRepository {
  append(event: OutboxEvent, tx?: any): Promise<void>;
  claimBatch(batchSize: number, lockOwner: string, leaseMs: number): Promise<OutboxEvent[]>;
  markPublished(eventIds: string[]): Promise<void>;
  markFailed(eventId: string, error: string, availableAt: Date, isMaxAttempts: boolean): Promise<void>;
  releaseLease(lockOwner: string): Promise<void>;
}
