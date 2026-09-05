export interface GetOrSetOptions {
  ttlSeconds?: number;
  enableJitter?: boolean;
}

export interface LockOptions {
  ttlMs?: number;
}

export interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  currentRequests: number;
  remainingRequests: number;
  resetSeconds: number;
}

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  delByPattern?(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getOrSet<T>(key: string, loader: () => Promise<T>, options?: GetOrSetOptions): Promise<T>;
  acquireLock(lockKey: string, lockOwnerToken: string, options?: LockOptions): Promise<boolean>;
  releaseLock(lockKey: string, lockOwnerToken: string): Promise<boolean>;
  rateLimit(limitKey: string, options: RateLimitOptions): Promise<RateLimitResult>;
  publish?(channel: string, message: string): Promise<number>;
  ping?(): Promise<boolean>;
}
