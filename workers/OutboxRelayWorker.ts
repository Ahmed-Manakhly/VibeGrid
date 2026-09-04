import amqp, { ConfirmChannel, Connection } from "amqplib";
import { IOutboxRepository } from "@/modules/outbox/domain/IOutboxRepository";
import { OutboxEvent } from "@/modules/outbox/domain/OutboxEvent";
import { ILogger } from "@/shared/application/ports/ILogger";
import { PinoLogger } from "@/shared/infrastructure/PinoLogger";

export interface OutboxRelayWorkerConfig {
  rabbitUrl: string;
  exchangeName?: string;
  pollIntervalMs?: number;
  batchSize?: number;
  maxAttempts?: number;
  leaseMs?: number;
  workerId?: string;
  logger?: ILogger;
}

export class OutboxRelayWorker {
  private connection: any = null;
  private channel: any = null;
  private isRunning = false;
  private timerId: NodeJS.Timeout | null = null;
  private logger: ILogger;

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
    this.logger = config.logger || new PinoLogger("vibegrid-outbox-relay");
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    this.logger.info(`Starting relay worker [${this.workerId}]`, { workerId: this.workerId });
    await this.connectRabbit();

    this.scheduleNextPoll(0);
  }

  private async connectRabbit(): Promise<void> {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || "amqp://vibegrid:VgRabbit_MQ2026%23b5%24WvL%212jRx@localhost:5672";
      const conn: any = await amqp.connect(rabbitUrl);
      this.connection = conn;
      this.channel = await conn.createConfirmChannel();
      await this.channel.assertExchange(this.exchange, "topic", { durable: true });

      this.logger.info(`Connected to RabbitMQ Exchange [${this.exchange}] with Confirm Channel`, {
        exchange: this.exchange,
        workerId: this.workerId,
      });
    } catch (err: any) {
      this.logger.error(`Failed to connect to RabbitMQ`, { error: err, workerId: this.workerId });
    }
  }

  private scheduleNextPoll(delayMs: number): void {
    if (!this.isRunning) return;
    this.timerId = setTimeout(() => {
      this.pollAndPublish()
        .catch((err) => this.logger.error(`Error in poll iteration`, { error: err, workerId: this.workerId }))
        .finally(() => this.scheduleNextPoll(this.pollIntervalMs));
    }, delayMs);
  }

  public async pollAndPublish(): Promise<{ claimed: number; published: number; failed: number }> {
    this.metrics.lastRunAt = new Date();

    if (!this.channel) {
      await this.connectRabbit();
      if (!this.channel) {
        return { claimed: 0, published: 0, failed: 0 };
      }
    }

    let events: OutboxEvent[] = [];
    try {
      events = await this.outboxRepo.claimBatch(this.batchSize, this.workerId, this.leaseMs);
    } catch (err) {
      this.logger.error(`Error claiming pending outbox events`, { error: err, workerId: this.workerId });
      return { claimed: 0, published: 0, failed: 0 };
    }

    if (events.length === 0) {
      return { claimed: 0, published: 0, failed: 0 };
    }

    this.logger.info(`Claimed ${events.length} pending outbox event(s)`, {
      count: events.length,
      workerId: this.workerId,
    });
    this.metrics.totalClaimed += events.length;

    const publishedIds: string[] = [];
    const failedEvents: Array<{ event: OutboxEvent; error: string }> = [];

    for (const event of events) {
      try {
        await this.publishWithConfirmation(event);
        publishedIds.push(event.eventId);
      } catch (err: any) {
        this.logger.error(`Failed to publish outbox event [${event.eventId}]`, {
          eventId: event.eventId,
          eventType: event.eventType,
          error: err,
        });
        failedEvents.push({ event, error: err?.message || String(err) });
      }
    }

    if (publishedIds.length > 0) {
      await this.outboxRepo.markPublished(publishedIds);
      this.metrics.totalPublished += publishedIds.length;
      this.logger.info(`Successfully published ${publishedIds.length} outbox event(s) to RabbitMQ`, {
        publishedCount: publishedIds.length,
        workerId: this.workerId,
      });
    }

    for (const { event, error } of failedEvents) {
      this.metrics.totalFailed++;
      const nextAttempt = event.attempts + 1;
      const isMaxAttempts = nextAttempt >= this.maxAttempts;
      const baseDelayMs = Math.min(1000 * Math.pow(2, nextAttempt), 60000);
      const jitterMs = Math.floor(Math.random() * 500);
      const availableAt = new Date(Date.now() + baseDelayMs + jitterMs);

      await this.outboxRepo.markFailed(event.eventId, error, availableAt, isMaxAttempts);
    }

    return {
      claimed: events.length,
      published: publishedIds.length,
      failed: failedEvents.length,
    };
  }

  private publishWithConfirmation(event: OutboxEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      const envelope = event.toCanonicalEnvelope();
      const content = Buffer.from(JSON.stringify(envelope));

      const routingKey = event.eventType;

      this.channel.publish(
        this.exchange,
        routingKey,
        content,
        {
          persistent: true,
          contentType: "application/json",
          messageId: event.eventId,
          timestamp: event.createdAt.getTime(),
          headers: {
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            correlationId: (event.payload as any)?.correlationId || event.eventId,
          },
        },
        (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.channel && typeof this.channel.close === "function") {
      await this.channel.close().catch(() => {});
    }
    if (this.connection && typeof this.connection.close === "function") {
      await this.connection.close().catch(() => {});
    }
    this.logger.info(`Stopped relay worker [${this.workerId}]`, { workerId: this.workerId });
  }

  public getMetrics() {
    return {
      ...this.metrics,
      workerId: this.workerId,
      isRunning: this.isRunning,
    };
  }
}
