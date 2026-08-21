import { IEventBus } from "@/shared/domain/events/IEventBus";

type EventCallback<T = any> = (event: T) => Promise<void> | void;

export class InMemoryEventBus implements IEventBus {
  private listeners: Record<string, EventCallback[]> = {};

  subscribe<T>(eventName: string, callback: EventCallback<T>) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  async publish<T>(eventName: string, event: T) {
    const callbacks = this.listeners[eventName] || [];
    Promise.allSettled(callbacks.map((cb) => cb(event))).catch((err) =>
      console.error(`[InMemoryEventBus] Error publishing ${eventName}:`, err)
    );
  }
}
