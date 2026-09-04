import { IEventBus } from "@/shared/domain/events/IEventBus";
import { IOutboxRepository } from "../domain/IOutboxRepository";
import { OutboxEvent } from "../domain/OutboxEvent";
import { ILogger } from "@/shared/application/ports/ILogger";
import { PinoLogger } from "@/shared/infrastructure/PinoLogger";
import crypto from "crypto";

type EventCallback<T = any> = (event: T) => Promise<void> | void;

export class TransactionalOutboxEventBus implements IEventBus {
  private listeners: Record<string, EventCallback[]> = {};
  private logger: ILogger;

  constructor(private outboxRepository: IOutboxRepository, logger?: ILogger) {
    this.logger = logger || new PinoLogger("vibegrid-eventbus");
  }

  public subscribe<T>(eventName: string, callback: EventCallback<T>): void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  public async publish<T>(eventName: string, payload: T, tx?: any): Promise<void> {
    const eventId = crypto.randomUUID();
    const mapped = this.mapEventToOutboxSpec(eventName, payload);

    const outboxEvent = new OutboxEvent({
      eventId,
      eventType: mapped.eventType,
      aggregateType: mapped.aggregateType,
      aggregateId: mapped.aggregateId,
      payload: (payload as any) || {},
    });

    // 1. Transactional Outbox Append (commits inside same DB transaction as business write if tx provided)
    await this.outboxRepository.append(outboxEvent, tx);

    // 2. Dispatch to local in-memory subscribers asynchronously
    const callbacks = this.listeners[eventName] || [];
    Promise.allSettled(callbacks.map((cb) => cb(payload))).catch((err) =>
      this.logger.error(`Subscriber error for event [${eventName}]`, { eventName, error: err })
    );
  }

  private mapEventToOutboxSpec(eventName: string, payload: any): { eventType: string; aggregateType: string; aggregateId: string } {
    switch (eventName) {
      case "VibeCreatedEvent":
        return {
          eventType: "vibe.created",
          aggregateType: "Post",
          aggregateId: payload?.vibeId || payload?.id || "unknown",
        };
      case "UserFollowedEvent":
        return {
          eventType: "user.followed",
          aggregateType: "User",
          aggregateId: payload?.followingId || payload?.targetUserId || "unknown",
        };
      case "LikeToggledEvent":
        return {
          eventType: "like.toggled",
          aggregateType: "Post",
          aggregateId: payload?.vibeId || payload?.postId || "unknown",
        };
      case "CommentAddedEvent":
        return {
          eventType: "comment.added",
          aggregateType: "Comment",
          aggregateId: payload?.commentId || "unknown",
        };
      case "user.registered":
        return {
          eventType: "user.registered",
          aggregateType: "User",
          aggregateId: payload?.userId || payload?.id || "unknown",
        };
      default:
        return {
          eventType: eventName.toLowerCase().replace(/event$/, ""),
          aggregateType: "DomainAggregate",
          aggregateId: payload?.id || payload?.aggregateId || "unknown",
        };
    }
  }
}
