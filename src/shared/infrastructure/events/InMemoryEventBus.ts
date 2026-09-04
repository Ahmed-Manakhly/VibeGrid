import { IEventBus } from "@/shared/domain/events/IEventBus";
import { ILogger } from "@/shared/application/ports/ILogger";
import { PinoLogger } from "../PinoLogger";

type EventCallback<T = any> = (event: T) => Promise<void> | void;

export class InMemoryEventBus implements IEventBus {
  private listeners: Record<string, EventCallback[]> = {};
  private logger: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger || new PinoLogger("vibegrid-eventbus");
  }

  subscribe<T>(eventName: string, callback: EventCallback<T>) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  async publish<T>(eventName: string, event: T) {
    const callbacks = this.listeners[eventName] || [];
    Promise.allSettled(callbacks.map((cb) => cb(event))).catch((err) =>
      this.logger.error(`[InMemoryEventBus] Error publishing ${eventName}`, { eventName, error: err })
    );
  }
}
