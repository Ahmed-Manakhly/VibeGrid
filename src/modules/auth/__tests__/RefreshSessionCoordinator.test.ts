import { RefreshSessionCoordinator } from '../application/RefreshSessionCoordinator';
import { ICacheService } from '@/shared/application/ports/ICacheService';
import { ILogger } from '@/shared/application/ports/ILogger';

// Mock authServiceFetch
jest.mock('@/lib/auth/auth.client', () => ({
  authServiceFetch: jest.fn(),
}));

import { authServiceFetch } from '@/lib/auth/auth.client';

class InMemoryCacheService implements ICacheService {
  private store = new Map<string, { value: any; expiry?: number }>();
  private locks = new Map<string, string>();
  private inFlightPromises = new Map<string, Promise<any>>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of Array.from(this.store.keys())) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async getOrSet<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    if (this.inFlightPromises.has(key)) return this.inFlightPromises.get(key)!;

    const promise = (async () => {
      try {
        const fresh = await loader();
        await this.set(key, fresh, 300);
        return fresh;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, promise);
    return promise;
  }

  async acquireLock(lockKey: string, lockOwnerToken: string): Promise<boolean> {
    if (this.locks.has(lockKey)) {
      return false;
    }
    this.locks.set(lockKey, lockOwnerToken);
    return true;
  }

  async releaseLock(lockKey: string, lockOwnerToken: string): Promise<boolean> {
    if (this.locks.get(lockKey) === lockOwnerToken) {
      this.locks.delete(lockKey);
      return true;
    }
    return false;
  }

  async rateLimit(): Promise<any> {
    return { allowed: true, currentRequests: 1, remainingRequests: 9, resetSeconds: 60 };
  }

  async publish(): Promise<number> {
    return 1;
  }

  async ping(): Promise<boolean> {
    return true;
  }
}

const mockLogger: ILogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockImplementation(() => mockLogger),
};

describe('RefreshSessionCoordinator', () => {
  let cache: InMemoryCacheService;
  let coordinator: RefreshSessionCoordinator;

  beforeEach(() => {
    jest.clearAllMocks();
    cache = new InMemoryCacheService();
    coordinator = new RefreshSessionCoordinator(cache, mockLogger);
  });

  it('Test A — Single refresh: rotates Token A -> Token B with exactly one Auth Service call', async () => {
    (authServiceFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        success: true,
        data: {
          accessToken: 'new_access_token_B',
          refreshToken: 'new_refresh_token_B',
        },
      },
    });

    const result = await coordinator.refresh('Token_A');

    expect(result.success).toBe(true);
    expect(result.accessToken).toBe('new_access_token_B');
    expect(result.refreshToken).toBe('new_refresh_token_B');
    expect(authServiceFetch).toHaveBeenCalledTimes(1);
    expect(authServiceFetch).toHaveBeenCalledWith('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'Token_A' }),
    });
  });

  it('Test B — Concurrent refresh: multiple concurrent callers using Token A execute exactly ONE Auth Service refresh call', async () => {
    (authServiceFetch as jest.Mock).mockImplementation(async () => {
      // Simulate slow Auth Service response (150ms)
      await new Promise((resolve) => setTimeout(resolve, 150));
      return {
        ok: true,
        status: 200,
        data: {
          success: true,
          data: {
            accessToken: 'concurrent_access_B',
            refreshToken: 'concurrent_refresh_B',
          },
        },
      };
    });

    const promise1 = coordinator.refresh('Token_A');
    const promise2 = coordinator.refresh('Token_A');
    const promise3 = coordinator.refresh('Token_A');

    const [res1, res2, res3] = await Promise.all([promise1, promise2, promise3]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res3.success).toBe(true);

    expect(res1.accessToken).toBe('concurrent_access_B');
    expect(res2.accessToken).toBe('concurrent_access_B');
    expect(res3.accessToken).toBe('concurrent_access_B');

    // CRITICAL SECURITY PROOF: Auth Service must be called EXACTLY ONCE
    expect(authServiceFetch).toHaveBeenCalledTimes(1);
  });

  it('Test D — Failed refresh: genuine Auth Service 401 failure is propagated normally', async () => {
    (authServiceFetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      data: {
        success: false,
        message: 'Invalid or revoked refresh token',
      },
    });

    const result = await coordinator.refresh('Revoked_Token_X');

    expect(result.success).toBe(false);
    expect(result.status).toBe(401);
    expect(result.message).toBe('Invalid or revoked refresh token');
    expect(authServiceFetch).toHaveBeenCalledTimes(1);
  });

  it('Test E — Refresh result propagation: subsequent callers using stale Token A receive cached result without calling Auth Service again', async () => {
    (authServiceFetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        success: true,
        data: {
          accessToken: 'cached_access_B',
          refreshToken: 'cached_refresh_B',
        },
      },
    });

    const firstCall = await coordinator.refresh('Token_Stale_A');
    expect(firstCall.accessToken).toBe('cached_access_B');
    expect(authServiceFetch).toHaveBeenCalledTimes(1);

    // Second call with same Token_Stale_A shortly after
    const secondCall = await coordinator.refresh('Token_Stale_A');
    expect(secondCall.accessToken).toBe('cached_access_B');

    // Auth Service count must REMAIN 1
    expect(authServiceFetch).toHaveBeenCalledTimes(1);
  });
});
