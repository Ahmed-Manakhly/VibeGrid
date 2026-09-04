import { ICacheService } from "@/shared/application/ports/ICacheService";

export type IdempotencyState = "UNSEEN" | "IN_PROGRESS" | "COMPLETED";

export class WorkerIdempotencyService {
  constructor(private cacheService: ICacheService) {}

  private getKey(queueName: string, eventId: string): string {
    return `idempotency:${queueName}:${eventId}`;
  }

  public async claim(queueName: string, eventId: string, ttlMs = 30000): Promise<boolean> {
    const key = this.getKey(queueName, eventId);
    const state = await this.cacheService.get<string>(key);

    if (state === "COMPLETED" || state === "IN_PROGRESS") {
      return false;
    }

    const acquired = await this.cacheService.acquireLock(key, "IN_PROGRESS", { ttlMs });
    if (!acquired) {
      // Re-verify if already completed
      const currentState = await this.cacheService.get<string>(key);
      return currentState !== "COMPLETED" && currentState !== "IN_PROGRESS";
    }

    await this.cacheService.set(key, "IN_PROGRESS", Math.ceil(ttlMs / 1000));
    return true;
  }

  public async complete(queueName: string, eventId: string, retentionSeconds = 604800): Promise<void> {
    const key = this.getKey(queueName, eventId);
    await this.cacheService.set(key, "COMPLETED", retentionSeconds);
  }

  public async release(queueName: string, eventId: string): Promise<void> {
    const key = this.getKey(queueName, eventId);
    await this.cacheService.delete(key);
  }
}
