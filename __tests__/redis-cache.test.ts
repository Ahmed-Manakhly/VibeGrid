import { RedisCacheService } from '../src/shared/infrastructure/cache/RedisCacheService';
import { RedisKeys, CACHE_TTL } from '../src/shared/infrastructure/cache/RedisKeys';

describe('RedisCacheService & Stampede Protection Suite', () => {
  let mockRedis: any;
  let cacheService: RedisCacheService;

  beforeEach(() => {
    const store = new Map<string, { value: string; ttl?: number }>();

    mockRedis = {
      get: jest.fn(async (key: string) => {
        const item = store.get(key);
        return item ? item.value : null;
      }),
      set: jest.fn(async (key: string, value: string, mode?: string, duration?: number, flag?: string) => {
        if (flag === 'NX' && store.has(key)) {
          return null;
        }
        store.set(key, { value, ttl: duration });
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        const existed = store.has(key);
        store.delete(key);
        return existed ? 1 : 0;
      }),
      exists: jest.fn(async (key: string) => (store.has(key) ? 1 : 0)),
      eval: jest.fn(async (script: string, numKeys: number, key: string, arg1?: string, arg2?: string) => {
        // Lua release lock or rate limit simulation
        if (script.includes('redis.call("del", KEYS[1])')) {
          const item = store.get(key);
          if (item && item.value === arg1) {
            store.delete(key);
            return 1;
          }
          return 0;
        }
        if (script.includes('redis.call("INCR", KEYS[1])')) {
          const currentItem = store.get(key);
          const currentCount = currentItem ? parseInt(currentItem.value, 10) + 1 : 1;
          store.set(key, { value: String(currentCount) });
          return [currentCount, parseInt(arg1 || '60', 10)];
        }
        return null;
      }),
    };

    cacheService = new RedisCacheService(mockRedis as any);
  });

  it('should set, get, and delete cached values cleanly', async () => {
    const testUser = { id: 'u1', username: 'alex' };
    const key = RedisKeys.user('alex');

    await cacheService.set(key, testUser, CACHE_TTL.USER);
    const cached = await cacheService.get(key);

    expect(cached).toEqual(testUser);

    await cacheService.delete(key);
    const afterDelete = await cacheService.get(key);
    expect(afterDelete).toBeNull();
  });

  it('should coalesce concurrent requests on cache miss (stampede protection)', async () => {
    const key = RedisKeys.post('post_100');
    let dbLoadCount = 0;

    const loader = jest.fn(async () => {
      dbLoadCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { id: 'post_100', content: 'Coalescence test' };
    });

    // Dispatch 10 concurrent getOrSet calls for the same key
    const results = await Promise.all(
      Array.from({ length: 10 }).map(() => cacheService.getOrSet(key, loader, { ttlSeconds: CACHE_TTL.POST }))
    );

    // Database loader should have been called ONLY once
    expect(loader).toHaveBeenCalledTimes(1);
    expect(dbLoadCount).toBe(1);
    expect(results.length).toBe(10);
    expect(results[0]).toEqual({ id: 'post_100', content: 'Coalescence test' });
  });

  it('should acquire and safely release owner-specific distributed lock', async () => {
    const lockKey = RedisKeys.lockOutboxRelay();
    const ownerA = 'worker_node_a';
    const ownerB = 'worker_node_b';

    const acquiredA = await cacheService.acquireLock(lockKey, ownerA, { ttlMs: 5000 });
    expect(acquiredA).toBe(true);

    // Concurrent acquire by another owner must fail
    const acquiredB = await cacheService.acquireLock(lockKey, ownerB, { ttlMs: 5000 });
    expect(acquiredB).toBe(false);

    // Non-owner release attempt must fail
    const releaseByB = await cacheService.releaseLock(lockKey, ownerB);
    expect(releaseByB).toBe(false);

    // Owner release must succeed
    const releaseByA = await cacheService.releaseLock(lockKey, ownerA);
    expect(releaseByA).toBe(true);
  });

  it('should enforce atomic rate limiting per IP and route', async () => {
    const limitKey = RedisKeys.ratelimit('127.0.0.1', '/api/vibe/feed');

    const res1 = await cacheService.rateLimit(limitKey, { windowSeconds: 60, maxRequests: 2 });
    expect(res1.allowed).toBe(true);
    expect(res1.currentRequests).toBe(1);

    const res2 = await cacheService.rateLimit(limitKey, { windowSeconds: 60, maxRequests: 2 });
    expect(res2.allowed).toBe(true);
    expect(res2.currentRequests).toBe(2);

    const res3 = await cacheService.rateLimit(limitKey, { windowSeconds: 60, maxRequests: 2 });
    expect(res3.allowed).toBe(false);
    expect(res3.currentRequests).toBe(3);
  });

  it('should degrade gracefully on Redis exception', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis connection dropped'));

    const result = await cacheService.getOrSet('faulty_key', async () => 'db_fallback_data');
    expect(result).toBe('db_fallback_data');
  });
});
