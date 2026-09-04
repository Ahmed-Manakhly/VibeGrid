import amqp, { ConfirmChannel, Connection } from "amqplib";
import { IOutboxRepository } from "@/modules/outbox/domain/IOutboxRepository";
import { OutboxEvent } from "@/modules/outbox/domain/OutboxEvent";

export interface OutboxRelayWorkerConfig {
  rabbitUrl: string;
  exchangeName?: string;
  pollIntervalMs?: number;
  batchSize?: number;
  maxAttempts?: number;
  leaseMs?: number;
  workerId?: string;
}

export class OutboxRelayWorker {
  private connection: any = null;
  private channel: any = null;
  private isRunning = false;
  private timerId: NodeJS.Timeout | null = null;

  private readonly exchange: string;
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly maxAttempts: number;
  private readonly leaseMs: number;
  private readonly workerId: string;

  private metrics = {
    totalClaimed: 0,
    totalPublished: 0,
    totalFailed: 0,
    lastRunAt: null as Date | null,
  };

  constructor(
    private outboxRepo: IOutboxRepository,
    config: OutboxRelayWorkerConfig
  ) {
    this.exchange = config.exchangeName || "domain.events";
    this.pollIntervalMs = config.pollIntervalMs || 1000;
    this.batchSize = config.batchSize || 20;
    this.maxAttempts = config.maxAttempts || 5;
    this.leaseMs = config.leaseMs || 30000;
    this.workerId = config.workerId || `relay-worker-${process.pid}-${Math.random().toString(36).substring(2, 7)}`;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`🚀 [OutboxRelayWorker] Starting relay worker [${this.workerId}]...`);
    await this.connectRabbit();

    this.scheduleNextPoll(0);
  }

  private async connectRabbit(): Promise<void> {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || "amqp://vibegrid:VgRabbit_MQ2026%23b5%24WvL%212jRx@localhost:5672";
      const conn: any = await amqp.connect(rabbitUrl);
      this.connection = conn;
      this.channel = await conn.createConfirmChannel();

      if (this.channel) {
        await this.channel.assertExchange(this.exchange, "topic", { durable: true });
        console.log(`✅ [OutboxRelayWorker] Connected to RabbitMQ Exchange [${this.exchange}] with Confirm Channel.`);
      }
    } catch (err: any) {
      console.error(`❌ [OutboxRelayWorker] Failed to connect to RabbitMQ:`, err.message);
    }
  }

  private scheduleNextPoll(delayMs: number): void {
    if (!this.isRunning) return;
    this.timerId = setTimeout(() => {
      this.pollAndPublish()
        .catch((err) => console.error(`[OutboxRelayWorker] Error in poll iteration:`, err))
        .finally(() => this.scheduleNextPoll(this.pollIntervalMs));
    }, delayMs);
  }

  public async pollAndPublish(): Promise<{ claimed: number; published: number; failed: number }> {
    this.metrics.lastRunAt = new Date();

    if (!this.channel) {
      await this.connectRabbit();
      if (!this.channel) return { claimed: 0, published: 0, failed: 0 };
    }

    // 1. Atomically claim batch of pending events using FOR UPDATE SKIP LOCKED
    const events = await this.outboxRepo.claimBatch(this.batchSize, this.workerId, this.leaseMs);
    if (events.length === 0) {
      return { claimed: 0, published: 0, failed: 0 };
    }

    this.metrics.totalClaimed += events.length;
    console.log(`📡 [OutboxRelayWorker] Claimed ${events.length} pending outbox event(s)`);

    const publishedIds: string[] = [];
    let failedCount = 0;

    // 2. Publish each event with RabbitMQ Publisher Confirmation
    for (const event of events) {
      try {
        await this.publishEventWithConfirm(event);
        publishedIds.push(event.eventId);
      } catch (err: any) {
        failedCount++;
        const nextAttempts = event.attempts + 1;
        const isMax = nextAttempts >= this.maxAttempts;
        const backoffMs = this.calculateBackoff(nextAttempts);
        const availableAt = new Date(Date.now() + backoffMs);

        console.error(
          `⚠️ [OutboxRelayWorker] Failed to publish event [${event.eventId}] (${event.eventType}). Attempt ${nextAttempts}/${this.maxAttempts}. Error: ${err.message}`
        );

        await this.outboxRepo.markFailed(event.eventId, err.message || "Publish failed", availableAt, isMax);
      }
    }

    // 3. Mark successfully published events
    if (publishedIds.length > 0) {
      await this.outboxRepo.markPublished(publishedIds);
      this.metrics.totalPublished += publishedIds.length;
      console.log(`   ✓ Successfully published ${publishedIds.length} outbox event(s) to RabbitMQ.`);
    }

    this.metrics.totalFailed += failedCount;
    return { claimed: events.length, published: publishedIds.length, failed: failedCount };
  }

  private publishEventWithConfirm(event: OutboxEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.channel) {
        return reject(new Error("RabbitMQ confirm channel not initialized"));
      }

      const envelope = event.toCanonicalEnvelope(1);
      const routingKey = event.eventType;
      const buffer = Buffer.from(JSON.stringify(envelope));

      this.channel.publish(
        this.exchange,
        routingKey,
        buffer,
        { persistent: true, messageId: event.eventId, timestamp: Math.floor(event.occurredAt.getTime() / 1000) },
        (err: any) => {
          if (err) {
            reject(new Error(`RabbitMQ ACK failed: ${err.message || err}`));
          } else {
            resolve();
          }
        }
      );
    });
  }

  private calculateBackoff(attempt: number): number {
    const baseMs = 1000;
    const maxBackoffMs = 60000;
    const jitter = Math.floor(Math.random() * 200);
    const exponential = Math.min(maxBackoffMs, baseMs * Math.pow(2, attempt - 1));
    return exponential + jitter;
  }

  public getMetrics() {
    return { ...this.metrics, isRunning: this.isRunning, workerId: this.workerId };
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.timerId) clearTimeout(this.timerId);

    if (this.outboxRepo && typeof this.outboxRepo.releaseLease === 'function') {
      try {
        await this.outboxRepo.releaseLease(this.workerId);
      } catch {
        // Ignore release lease errors during shutdown
      }
    }

    if (this.channel && typeof (this.channel as any).close === 'function') {
      await (this.channel as any).close().catch(() => {});
    }
    if (this.connection && typeof (this.connection as any).close === 'function') {
      await (this.connection as any).close().catch(() => {});
    }

    console.log(`🛑 [OutboxRelayWorker] Stopped relay worker [${this.workerId}].`);
  }
}
