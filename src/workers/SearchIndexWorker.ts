import amqp, { Channel, ConsumeMessage } from "amqplib";
import { PrismaClient } from "@prisma/client";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { ILogger } from "@/shared/application/ports/ILogger";
import { PinoLogger } from "@/shared/infrastructure/PinoLogger";
import { WorkerIdempotencyService } from "./WorkerIdempotencyService";

export interface SearchIndexWorkerConfig {
  rabbitUrl: string;
  exchangeName?: string;
  queueName?: string;
  dlxExchange?: string;
  dlqName?: string;
  logger?: ILogger;
}

export class SearchIndexWorker {
  private connection: any = null;
  private channel: Channel | null = null;
  private isRunning = false;

  private readonly exchange: string;
  private readonly queue: string;
  private readonly dlxExchange: string;
  private readonly dlqQueue: string;
  private readonly logger: ILogger;
  private readonly idempotency: WorkerIdempotencyService;

  constructor(
    private prisma: PrismaClient,
    private cacheService: ICacheService,
    config: SearchIndexWorkerConfig
  ) {
    this.exchange = config.exchangeName || "domain.events";
    this.queue = config.queueName || "q.search.indexing";
    this.dlxExchange = config.dlxExchange || "dlx.domain";
    this.dlqQueue = config.dlqName || "q.dlq";
    this.logger = config.logger || new PinoLogger("vibegrid-search-worker");
    this.idempotency = new WorkerIdempotencyService(this.cacheService);
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://vibegrid:VgRabbit_MQ2026%23b5%24WvL%212jRx@localhost:5672";
    this.connection = await amqp.connect(rabbitUrl);
    this.channel = await this.connection.createChannel();

    if (!this.channel) throw new Error("Failed to create RabbitMQ channel for SearchIndexWorker");

    await this.channel.prefetch(10);
    await this.channel.assertExchange(this.exchange, "topic", { durable: true });
    await this.channel.assertExchange(this.dlxExchange, "direct", { durable: true });

    await this.channel.assertQueue(this.dlqQueue, { durable: true });
    await this.channel.bindQueue(this.dlqQueue, this.dlxExchange, "dlq.search");

    await this.channel.assertQueue(this.queue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": this.dlxExchange,
        "x-dead-letter-routing-key": "dlq.search",
      },
    });

    await this.channel.bindQueue(this.queue, this.exchange, "vibe.created");
    await this.channel.bindQueue(this.queue, this.exchange, "user.registered");
    await this.channel.bindQueue(this.queue, this.exchange, "profile.updated");

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
          this.logger.info(`Skipped duplicate or in-flight search indexing event [${eventId}]`, { eventId, correlationId });
          this.channel?.ack(msg);
          return;
        }

        this.logger.info(`Processing search indexing event [${envelope.eventName || envelope.eventType}]`, {
          eventId,
          eventName: envelope.eventName || envelope.eventType,
          correlationId,
        });

        await this.processIndex(envelope);

        await this.idempotency.complete(this.queue, eventId);
        this.channel?.ack(msg);
      } catch (err: any) {
        const deathCount = this.getDeathCount(msg);
        this.logger.error(`SearchIndexWorker processing error (attempt ${deathCount + 1})`, { attempt: deathCount + 1, error: err });

        if (deathCount >= 3) {
          this.logger.warn(`Max retries (3) reached. Routing search event to DLQ`, { dlqQueue: this.dlqQueue });
          this.channel?.publish(this.dlxExchange, "dlq.search", msg.content, { persistent: true });
          this.channel?.ack(msg);
        } else {
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }

  private async processIndex(envelope: any): Promise<void> {
    const eventType = envelope.eventName || envelope.eventType;
    const payload = envelope.payload || {};

    if (eventType === "vibe.created") {
      const postId = payload.vibeId || payload.id;
      if (!postId) return;

      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        include: { author: true, category: true, vibe: true, tags: { include: { tag: true } } },
      });

      if (post) {
        const indexKey = `search:post:${post.id}`;
        const searchableDoc = {
          id: post.id,
          type: "post",
          content: post.content || "",
          author: post.author.name || post.author.username,
          category: post.category?.name || null,
          vibe: post.vibe?.label || post.vibe?.key || null,
          tags: post.tags.map((t) => t.tag.name),
          indexedAt: new Date().toISOString(),
        };
        await this.cacheService.set(indexKey, searchableDoc, 86400 * 30);
        this.logger.info(`Indexed post [${post.id}] for search`, { postId: post.id });
      }
    } else if (eventType === "user.registered" || eventType === "profile.updated") {
      const userId = payload.userId || payload.id;
      if (!userId) return;

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const indexKey = `search:user:${user.id}`;
        const searchableDoc = {
          id: user.id,
          type: "user",
          username: user.username,
          name: user.name,
          bio: user.bio,
          indexedAt: new Date().toISOString(),
        };
        await this.cacheService.set(indexKey, searchableDoc, 86400 * 30);
        this.logger.info(`Indexed user [${user.id}] for search`, { userId: user.id });
      }
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
    this.logger.info(`Stopped SearchIndexWorker`, { queue: this.queue });
  }
}
