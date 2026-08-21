export interface IEventBus {
  publish<T>(eventName: string, event: T): Promise<void> | void;
  subscribe<T>(eventName: string, handler: (event: T) => Promise<void> | void): void;
}
