import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';
import { cacheService } from '@/shared/infrastructure/di-container';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(COOKIE_CONFIG.refreshToken.name)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token missing' },
        { status: 401 }
      );
    }

    const lockOwnerToken = crypto.randomUUID();
    const lockKey = `lock:refresh:${refreshToken}`;

    // Acquire 5-second distributed lock in Redis to serialize concurrent refresh attempts
    const acquired = await cacheService.acquireLock(lockKey, lockOwnerToken, { ttlMs: 5000 });

    if (!acquired) {
      // If another request is currently refreshing this family, wait 300ms for lock release / token update
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Re-read current cookies or check if access token was successfully updated
      const latestAccessToken = req.cookies.get(COOKIE_CONFIG.accessToken.name)?.value;
      if (latestAccessToken) {
        return NextResponse.json({
          success: true,
          message: 'Token refreshed concurrently',
        });
      }
    }

    try {
      const authRes = await authServiceFetch('/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      const isSuccess = authRes.ok && (authRes.data?.status === 'success' || authRes.data?.success === true);
      if (!isSuccess) {
        const response = NextResponse.json(
          { success: false, message: authRes.data?.message || 'Session expired' },
          { status: 401 }
        );
        response.cookies.delete(COOKIE_CONFIG.accessToken.name);
        response.cookies.delete(COOKIE_CONFIG.refreshToken.name);
        return response;
      }

      const result = authRes.data?.data || authRes.data;
      let newAccessToken = result?.accessToken || result?.tokens?.accessToken;
      let newRefreshToken = result?.refreshToken || result?.tokens?.refreshToken;

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

      const response = NextResponse.json({
        success: true,
        message: 'Token refreshed successfully',
      });

      if (newAccessToken) {
        response.cookies.set(
          COOKIE_CONFIG.accessToken.name,
          decodeURIComponent(newAccessToken),
          COOKIE_CONFIG.accessToken.options
        );
      }

      if (newRefreshToken) {
        response.cookies.set(
          COOKIE_CONFIG.refreshToken.name,
          decodeURIComponent(newRefreshToken),
          COOKIE_CONFIG.refreshToken.options
        );
      }

      return response;
    } finally {
      if (acquired) {
        await cacheService.releaseLock(lockKey, lockOwnerToken).catch(() => {});
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Refresh error' },
      { status: 500 }
    );
  }
}
