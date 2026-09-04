import amqp, { Channel, ConsumeMessage } from "amqplib";
import { INotificationRepository } from "@/modules/notification/domain/INotificationRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { ILogger } from "@/shared/application/ports/ILogger";
import { PinoLogger } from "@/shared/infrastructure/PinoLogger";
import { WorkerIdempotencyService } from "./WorkerIdempotencyService";

export interface NotificationWorkerConfig {
  rabbitUrl: string;
  exchangeName?: string;
  queueName?: string;
  dlxExchange?: string;
  dlqName?: string;
  logger?: ILogger;
}

export class NotificationWorker {
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
    private notificationRepo: INotificationRepository,
    private cacheService: ICacheService,
    config: NotificationWorkerConfig
  ) {
    this.exchange = config.exchangeName || "domain.events";
    this.queue = config.queueName || "q.notifications.push";
    this.dlxExchange = config.dlxExchange || "dlx.domain";
    this.dlqQueue = config.dlqName || "q.dlq";
    this.logger = config.logger || new PinoLogger("vibegrid-notification-worker");
    this.idempotency = new WorkerIdempotencyService(this.cacheService);
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    const rabbitUrl = process.env.RABBITMQ_URL || "amqp://vibegrid:VgRabbit_MQ2026%23b5%24WvL%212jRx@localhost:5672";
    this.connection = await amqp.connect(rabbitUrl);
    this.channel = await this.connection.createChannel();

    if (!this.channel) throw new Error("Failed to create RabbitMQ channel for NotificationWorker");

    await this.channel.prefetch(10);
    await this.channel.assertExchange(this.exchange, "topic", { durable: true });
    await this.channel.assertExchange(this.dlxExchange, "direct", { durable: true });

    await this.channel.assertQueue(this.dlqQueue, { durable: true });
    await this.channel.bindQueue(this.dlqQueue, this.dlxExchange, "dlq.notification");

    await this.channel.assertQueue(this.queue, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": this.dlxExchange,
        "x-dead-letter-routing-key": "dlq.notification",
      },
    });

    await this.channel.bindQueue(this.queue, this.exchange, "user.followed");
    await this.channel.bindQueue(this.queue, this.exchange, "social.followed");
    await this.channel.bindQueue(this.queue, this.exchange, "like.toggled");
    await this.channel.bindQueue(this.queue, this.exchange, "engagement.liked");
    await this.channel.bindQueue(this.queue, this.exchange, "comment.added");
    await this.channel.bindQueue(this.queue, this.exchange, "engagement.commented");

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
          this.logger.info(`Skipped duplicate or in-flight notification event [${eventId}]`, { eventId, correlationId });
          this.channel?.ack(msg);
          return;
        }

        this.logger.info(`Processing notification event [${envelope.eventName || envelope.eventType}]`, {
          eventId,
          eventName: envelope.eventName || envelope.eventType,
          correlationId,
        });

        await this.processNotification(envelope);

        await this.idempotency.complete(this.queue, eventId);
        this.channel?.ack(msg);
      } catch (err: any) {
        const deathCount = this.getDeathCount(msg);
        this.logger.error(`NotificationWorker processing error (attempt ${deathCount + 1})`, { attempt: deathCount + 1, error: err });

        if (deathCount >= 3) {
          this.logger.warn(`Max retries (3) reached. Routing notification event to DLQ`, { dlqQueue: this.dlqQueue });
          this.channel?.publish(this.dlxExchange, "dlq.notification", msg.content, { persistent: true });
          this.channel?.ack(msg);
        } else {
          this.channel?.nack(msg, false, false);
        }
      }
    });
  }

  private async processNotification(envelope: any): Promise<void> {
    const eventType = envelope.eventName || envelope.eventType;
    const payload = envelope.payload || {};

    let targetUserId: string | undefined;
    let creatorId: string | undefined;
    let notifType: "FOLLOW" | "LIKE" | "COMMENT" | undefined;
    let postId: string | undefined;
    let commentId: string | undefined;

    if (eventType === "user.followed" || eventType === "social.followed") {
      targetUserId = payload.followingId || payload.targetUserId;
      creatorId = payload.followerId;
      notifType = "FOLLOW";
    } else if (eventType === "like.toggled" || eventType === "engagement.liked") {
      targetUserId = payload.authorId;
      creatorId = payload.likerId || payload.userId;
      notifType = "LIKE";
      postId = payload.vibeId || payload.postId;
    } else if (eventType === "comment.added" || eventType === "engagement.commented") {
      targetUserId = payload.authorId;
      creatorId = payload.commenterId || payload.userId;
      notifType = "COMMENT";
      postId = payload.vibeId || payload.postId;
      commentId = payload.commentId;
    }

    if (!targetUserId || !creatorId || !notifType) {
      this.logger.warn(`Skipping invalid notification payload`, { eventType, payload });
      return;
    }

    // Do not notify self-actions
    if (targetUserId === creatorId) {
      return;
    }

    const created = await this.notificationRepo.create({
      userId: targetUserId,
      creatorId,
      type: notifType,
      postId,
      commentId,
    });

    this.logger.info(`Persisted ${notifType} notification for user [${targetUserId}]`, {
      notificationId: created.id,
      targetUserId,
      creatorId,
      type: notifType,
    });

    try {
      if (this.cacheService.publish) {
        const realtimePayload = JSON.stringify({
          userId: targetUserId,
          notification: {
            id: created.id,
            type: created.type,
            userId: created.userId,
            creatorId: created.creatorId,
            postId: created.postId,
            commentId: created.commentId,
            isRead: created.isRead,
            createdAt: created.createdAt,
          },
        });
        await this.cacheService.publish("realtime:notification", realtimePayload);
      }
    } catch (pubErr) {
      this.logger.warn("Failed to publish notification event to Redis Pub/Sub", { error: pubErr });
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
    this.logger.info(`Stopped NotificationWorker`, { queue: this.queue });
  }
}
