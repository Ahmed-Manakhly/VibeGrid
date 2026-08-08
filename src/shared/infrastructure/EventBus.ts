// Simple in-memory Event Bus for Domain Events

type EventCallback<T = any> = (event: T) => Promise<void> | void;

class EventBus {
  private listeners: Record<string, EventCallback[]> = {};

  subscribe<T>(eventName: string, callback: EventCallback<T>) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  async publish<T>(eventName: string, event: T) {
    const callbacks = this.listeners[eventName] || [];
    // We execute them asynchronously so the main thread isn't blocked by side effects
    Promise.allSettled(callbacks.map((cb) => cb(event))).catch((err) =>
      console.error(`[EventBus] Error publishing ${eventName}:`, err)
    );
  }
}

export const DomainEventBus = new EventBus();
