import { ICacheService } from '@/shared/application/ports/ICacheService';
import { ILogger } from '@/shared/application/ports/ILogger';
import { authServiceFetch } from '@/lib/auth/auth.client';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';


export interface RefreshSessionResult {
  success: boolean;
  status: number;
  message?: string;
  accessToken?: string;
  refreshToken?: string;
}

export class RefreshSessionCoordinator {
  constructor(
    private cacheService: ICacheService,
    private logger: ILogger
  ) {}

  private async hashToken(refreshToken: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(refreshToken);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `fp_${hex.substring(0, 32)}`;
  }

  public async refresh(refreshToken: string): Promise<RefreshSessionResult> {
    if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
      return { success: false, status: 401, message: 'Refresh token missing' };
    }

    const tokenFp = await this.hashToken(refreshToken);
    const lockKey = `lock:refresh:${tokenFp}`;
    const resultKey = `refresh:result:${tokenFp}`;

    // 1. Fast path: Return cached refresh result if another request already rotated this token
    const cachedResult = await this.cacheService.get<RefreshSessionResult>(resultKey);
    if (cachedResult) {
      this.logger.info(`[RefreshSessionCoordinator] Returning cached single-flight refresh result for tokenFp=${tokenFp}`);
      return cachedResult;
    }

    const lockOwnerToken = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : Math.random().toString(36).substring(2);

    // 2. Acquire 5-second distributed Redis lock to serialize concurrent refresh attempts
    const acquired = await this.cacheService.acquireLock(lockKey, lockOwnerToken, { ttlMs: 5000 });

    if (!acquired) {
      this.logger.info(`[RefreshSessionCoordinator] Lock acquired by another request. Waiting for single-flight result... tokenFp=${tokenFp}`);

      // Wait up to 3 seconds (30 * 100ms) for the lock owner to complete Auth Service rotation and set resultKey
      for (let i = 0; i < 30; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const result = await this.cacheService.get<RefreshSessionResult>(resultKey);
        if (result) {
          this.logger.info(`[RefreshSessionCoordinator] Single-flight wait resolved on attempt ${i + 1} tokenFp=${tokenFp}`);
          return result;
        }
      }

      this.logger.warn(`[RefreshSessionCoordinator] Wait timed out for single-flight refresh tokenFp=${tokenFp}`);
      return { success: false, status: 401, message: 'Refresh lock timeout' };
    }

    try {
      // Re-check cached result right after acquiring lock in case of race right before acquisition
      const resultBeforeAuth = await this.cacheService.get<RefreshSessionResult>(resultKey);
      if (resultBeforeAuth) {
        return resultBeforeAuth;
      }

      this.logger.info(`[RefreshSessionCoordinator] Lock acquired. Executing single Auth Service /refresh for tokenFp=${tokenFp}`);

      const authRes = await authServiceFetch('/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      const isSuccess = authRes.ok && (authRes.data?.status === 'success' || authRes.data?.success === true);

      if (!isSuccess) {
        const failureResult: RefreshSessionResult = {
          success: false,
          status: authRes.status || 401,
          message: authRes.data?.message || 'Session expired',
        };
        // Cache failure result briefly (5s) to avoid repeating failed refresh calls for the same invalid token
        await this.cacheService.set(resultKey, failureResult, 5);
        return failureResult;
      }

      const rawData = authRes.data?.data || authRes.data;
      let newAccessToken = rawData?.accessToken || rawData?.tokens?.accessToken;
      let newRefreshToken = rawData?.refreshToken || rawData?.tokens?.refreshToken;

      if (!newAccessToken && authRes.headers) {
        const headers = authRes.headers;
        const getCookieVal = (name: string) => {
          const rawCookies = (headers as any).getSetCookie ? (headers as any).getSetCookie() : [headers.get('set-cookie') || ''];
          for (const header of rawCookies) {
            const match = header.match(new RegExp(`${name}=([^;]+)`));
            if (match) return decodeURIComponent(match[1]);
          }
          return null;
        };
        newAccessToken = getCookieVal(COOKIE_CONFIG.accessToken.name);
        newRefreshToken = getCookieVal(COOKIE_CONFIG.refreshToken.name);
      }

      const successResult: RefreshSessionResult = {
        success: true,
        status: 200,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };

      // Cache successful rotated token result for 30 seconds so concurrent/stale requests get the new token without calling Auth Service
      await this.cacheService.set(resultKey, successResult, 30);
      this.logger.info(`[RefreshSessionCoordinator] Token rotation succeeded and single-flight result cached for tokenFp=${tokenFp}`);

      return successResult;
    } finally {
      if (acquired) {
        await this.cacheService.releaseLock(lockKey, lockOwnerToken).catch(() => {});
      }
    }
  }
}
