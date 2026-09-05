import Redis from 'ioredis';
import {
  ICacheService,
  GetOrSetOptions,
  LockOptions,
  RateLimitOptions,
  RateLimitResult,
} from '@/shared/application/ports/ICacheService';
import { ILogger } from '@/shared/application/ports/ILogger';
import { PinoLogger } from '../PinoLogger';

export class RedisCacheService implements ICacheService {
  private client: Redis | null = null;
  private logger: ILogger;
  private inFlightPromises = new Map<string, Promise<any>>();

  constructor(redisClientOrUrl?: Redis | string, logger?: ILogger) {
    this.logger = logger || new PinoLogger("vibegrid-cache");

    if (typeof redisClientOrUrl === 'string') {
      this.client = new Redis(redisClientOrUrl, { lazyConnect: true, maxRetriesPerRequest: 3 });
    } else if (redisClientOrUrl) {
      this.client = redisClientOrUrl;
    } else {
      const url = process.env.REDIS_URL || 'redis://:VgRedis_R2026%23m4%24ZpQ%219wKx@localhost:6379';
      this.client = new Redis(url, { maxRetriesPerRequest: 3 });
    }

    if (this.client && typeof this.client.on === 'function') {
      this.client.on('error', (err) => {
        this.logger.error('[RedisCacheService] Redis client error:', err);
      });
    }
  }

  private applyJitter(ttlSeconds: number): number {
    const jitter = Math.floor(Math.random() * (ttlSeconds * 0.1));
    return Math.max(1, ttlSeconds + (Math.random() > 0.5 ? jitter : -jitter));
  }

  public async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const raw = await this.client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      this.logger.warn(`[RedisCacheService] GET failed for key [${key}], falling back to miss`, { key, error: err });
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds && ttlSeconds > 0) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      this.logger.warn(`[RedisCacheService] SET failed for key [${key}]`, { key, error: err });
    }
  }

  public async delete(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.warn(`[RedisCacheService] DELETE failed for key [${key}]`, { key, error: err });
    }
  }

  public async delByPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      let cursor = '0';
      const keysToDelete: string[] = [];
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys && keys.length > 0) {
          keysToDelete.push(...keys);
        }
      } while (cursor !== '0');

      if (keysToDelete.length > 0) {
        await this.client.del(...keysToDelete);
      }
    } catch (err) {
      this.logger.warn(`[RedisCacheService] delByPattern failed for pattern [${pattern}]`, { pattern, error: err });
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const res = await this.client.exists(key);
      return res === 1;
    } catch (err) {
      this.logger.warn(`[RedisCacheService] EXISTS failed for key [${key}]`, { key, error: err });
      return false;
    }
  }

  public async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    options?: GetOrSetOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    if (this.inFlightPromises.has(key)) {
      return this.inFlightPromises.get(key)!;
    }

    const promise = (async () => {
      try {
        const fresh = await loader();
        const baseTtl = options?.ttlSeconds || 300;
        const finalTtl = options?.enableJitter !== false ? this.applyJitter(baseTtl) : baseTtl;
        await this.set(key, fresh, finalTtl);
        return fresh;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, promise);
    return promise;
  }

  public async acquireLock(
    lockKey: string,
    lockOwnerToken: string,
    options?: LockOptions
  ): Promise<boolean> {
    if (!this.client) return false;
    const ttlMs = options?.ttlMs || 10000;
    try {
      const result = await this.client.set(lockKey, lockOwnerToken, 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch (err) {
      this.logger.warn(`[RedisCacheService] Acquire lock failed for [${lockKey}]`, { lockKey, error: err });
      return false;
    }
  }

  public async releaseLock(lockKey: string, lockOwnerToken: string): Promise<boolean> {
    if (!this.client) return false;
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    try {
      const res = await this.client.eval(luaScript, 1, lockKey, lockOwnerToken);
      return res === 1;
    } catch (err) {
      this.logger.warn(`[RedisCacheService] Release lock failed for [${lockKey}]`, { lockKey, error: err });
      return false;
    }
  }

  public async rateLimit(limitKey: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const { windowSeconds, maxRequests } = options;
    const defaultResult: RateLimitResult = {
      allowed: true,
      currentRequests: 1,
      remainingRequests: maxRequests - 1,
      resetSeconds: windowSeconds,
    };

    if (!this.client) return defaultResult;

    const luaScript = `
      local current = redis.call("INCR", KEYS[1])
      if tonumber(current) == 1 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
      end
      local ttl = redis.call("TTL", KEYS[1])
      return {current, ttl}
    `;

    try {
      const res: any = await this.client.eval(luaScript, 1, limitKey, windowSeconds);
      const currentRequests = parseInt(res[0], 10);
      const ttl = parseInt(res[1], 10);

      const allowed = currentRequests <= maxRequests;
      const remainingRequests = Math.max(0, maxRequests - currentRequests);

      return {
        allowed,
        currentRequests,
        remainingRequests,
        resetSeconds: ttl > 0 ? ttl : windowSeconds,
      };
    } catch (err) {
      this.logger.warn(`[RedisCacheService] RateLimit failed for [${limitKey}], failing open`, { limitKey, error: err });
      return defaultResult;
    }
  }

  public async publish(channel: string, message: string): Promise<number> {
    if (!this.client) return 0;
    try {
      return await this.client.publish(channel, message);
    } catch (err) {
      this.logger.warn(`[RedisCacheService] PUBLISH failed for channel [${channel}]`, { channel, error: err });
      return 0;
    }
  }

  public async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const res = await this.client.ping();
      return res === 'PONG';
    } catch (err) {
      return false;
    }
  }
}
