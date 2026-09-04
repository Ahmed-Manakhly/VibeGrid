import amqp, { Channel, ConsumeMessage } from "amqplib";
import { ISocialRepository } from "@/modules/social/domain/ISocialRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { ILogger } from "@/shared/application/ports/ILogger";
import { PinoLogger } from "@/shared/infrastructure/PinoLogger";
import { WorkerIdempotencyService } from "./WorkerIdempotencyService";

export interface FanOutWorkerConfig {
  rabbitUrl: string;
  exchangeName?: string;
  queueName?: string;
  dlxExchange?: string;
  dlqName?: string;
  hybridThreshold?: number; // Default 5000 followers
  logger?: ILogger;
}

export class FanOutWorker {
  private connection: any = null;
  private channel: Channel | null = null;
  private isRunning = false;

  private readonly exchange: string;
  private readonly queue: string;
  private readonly dlxExchange: string;
  private readonly dlqQueue: string;
  private readonly threshold: number;
  private readonly logger: ILogger;
  private readonly idempotency: WorkerIdempotencyService;

  constructor(
    private socialRepo: ISocialRepository,
    private cacheService: ICacheService,
    config: FanOutWorkerConfig
  ) {
    this.exchange = config.exchangeName || "domain.events";
    this.queue = config.queueName || "q.timeline.fanout";
    this.dlxExchange = config.dlxExchange || "dlx.domain";
    this.dlqQueue = config.dlqName || "q.dlq";
    this.threshold = config.hybridThreshold || 5000;
    this.logger = config.logger || new PinoLogger("vibegrid-fanout-worker");
    this.idempotency = new WorkerIdempotencyService(this.cacheService);
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://vibegrid:VgRabbit_MQ2026%23b5%24WvL%212jRx@localhost:5672";
    this.connection = await amqp.connect(rabbitUrl);
    this.channel = await this.connection.createChannel();

    if (!this.channel) throw new Error("Failed to create RabbitMQ channel for FanOutWorker");

    await this.channel.prefetch(10);
    await this.channel.assertExchange(this.exchange, "topic", { durable: true });
    await this.channel.assertExchange(this.dlxExchange, "direct", { durable: true });

    await this.channel.assertQueue(this.dlqQueue, { durable: true });
    await this.channel.bindQueue(this.dlqQueue, this.dlxExchange, "dlq.fanout");

    await this.channel.assertQueue(this.queue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": this.dlxExchange,
        "x-dead-letter-routing-key": "dlq.fanout",
      },
    });

    await this.channel.bindQueue(this.queue, this.exchange, "vibe.created");
    await this.channel.bindQueue(this.queue, this.exchange, "regrid.created");

    this.logger.info(`Bound queue [${this.queue}] to exchange [${this.exchange}]`, { queue: this.queue });

    await this.channel.consume(this.queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content = msg.content.toString();
        const envelope = JSON.parse(content);
        const eventId = envelope.eventId || envelope.id || `evt-${Date.now()}`;
        const correlationId = envelope.correlationId || envelope.payload?.correlationId;

        const claimed = await this.idempotency.claim(this.queue, eventId);
        if (!claimed) {
          this.logger.info(`Skipped duplicate or in-flight fanout event [${eventId}]`, { eventId, correlationId });
          this.channel?.ack(msg);
          return;
        }

        this.logger.info(`Processing fan-out event [${envelope.eventName || envelope.eventType}]`, {
          eventId,
          eventName: envelope.eventName || envelope.eventType,
          correlationId,
        });

        await this.processFanOut(envelope);

        await this.idempotency.complete(this.queue, eventId);
        this.channel?.ack(msg);
      } catch (err: any) {
        const deathCount = this.getDeathCount(msg);
        this.logger.error(`FanOutWorker processing error (attempt ${deathCount + 1})`, { attempt: deathCount + 1, error: err });

        if (deathCount >= 3) {
          this.logger.warn(`Max retries (3) reached. Routing fan-out event to DLQ`, { dlqQueue: this.dlqQueue });
          this.channel?.publish(this.dlxExchange, "dlq.fanout", msg.content, { persistent: true });
          this.channel?.ack(msg);
        } else {
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }

  private async processFanOut(envelope: any): Promise<void> {
    const payload = envelope.payload || {};
    const authorId = payload.authorId || payload.userId;
    const vibeId = payload.vibeId || payload.id;

    if (!authorId || !vibeId) {
      this.logger.warn(`Missing authorId or vibeId in fan-out payload`, { payload });
      return;
    }

    const followers = await this.socialRepo.getFollowerIds(authorId);

    if (followers.length >= this.threshold) {
      this.logger.info(`Author [${authorId}] has ${followers.length} followers (>= ${this.threshold}). Using pull model.`, {
        authorId,
        followerCount: followers.length,
      });
      return;
    }

    // Hybrid Push model: Push vibeId to each follower's feed cache in Redis
    for (const followerId of followers) {
      const feedKey = `timeline:${followerId}`;
      const existingFeed = (await this.cacheService.get<string[]>(feedKey)) || [];
      if (!existingFeed.includes(vibeId)) {
        const updatedFeed = [vibeId, ...existingFeed].slice(0, 800);
        await this.cacheService.set(feedKey, updatedFeed, 86400);
      }
    }

    this.logger.info(`Pushed vibe [${vibeId}] to ${followers.length} follower timeline cache(s)`, {
      vibeId,
      pushedCount: followers.length,
    });

    try {
      if (this.cacheService.publish) {
        const feedSignalPayload = JSON.stringify({
          type: "new_content",
          postId: vibeId,
          recipientIds: followers,
        });
        await this.cacheService.publish("realtime:feed", feedSignalPayload);
      }
    } catch (pubErr) {
      this.logger.warn("Failed to publish feed signal to Redis Pub/Sub", { error: pubErr });
    }
  }

  private getDeathCount(msg: ConsumeMessage): number {
    const headers = msg.properties.headers;
    if (headers && headers["x-death"]) {
      const xDeath = headers["x-death"];
      if (Array.isArray(xDeath) && xDeath.length > 0) {
        return xDeath[0].count || 1;
      }
    }
    return 0;
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.channel && typeof this.channel.close === "function") await this.channel.close().catch(() => {});
    if (this.connection && typeof this.connection.close === "function") await this.connection.close().catch(() => {});
    this.logger.info(`Stopped FanOutWorker`, { queue: this.queue });
  }
}
