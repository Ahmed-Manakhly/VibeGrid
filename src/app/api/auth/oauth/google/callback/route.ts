import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';
import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';
import { logger } from '@/shared/infrastructure/di-container';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const clientBaseUrl = `${proto}://${host}`;

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', clientBaseUrl));
  }

  try {
    const { apiBaseUrl } = EnvConfigRepository.getEndpoints();
    const authRes = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/auth/oauth/google/callback?code=${encodeURIComponent(code)}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    const data = await authRes.json();

    const isSuccess = authRes.ok && (data?.status === 'success' || data?.success === true);
    if (!isSuccess) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', clientBaseUrl));
    }

    const { user, accessToken, refreshToken } = data.data || {};

    // Idempotent Native Profile Bootstrap
    if (user) {
      const { ProfileBootstrapService } = await import('@/modules/social/application/ProfileBootstrapService');
      await ProfileBootstrapService.bootstrapProfile({
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }).catch((err) => logger.warn('[Google OAuth Profile Bootstrap Warning]', { error: err }));
    }

    // Response redirecting to homepage after setting BFF HttpOnly cookies
    const response = NextResponse.redirect(new URL('/', clientBaseUrl));

    // Extract cookies from Auth Microservice headers or payload
    let accToken = accessToken;
    let refToken = refreshToken;

    if (!accToken && authRes.headers) {
      const getCookieVal = (name: string) => {
        const rawCookies = (authRes.headers as any).getSetCookie ? (authRes.headers as any).getSetCookie() : [authRes.headers.get('set-cookie') || ''];
        for (const header of rawCookies) {
          const match = header.match(new RegExp(`${name}=([^;]+)`));
          if (match) return match[1];
        }
        return null;
      };
      accToken = getCookieVal(COOKIE_CONFIG.accessToken.name);
      refToken = getCookieVal(COOKIE_CONFIG.refreshToken.name);
    }

    if (accToken) {
      response.cookies.set(
        COOKIE_CONFIG.accessToken.name,
        accToken,
        COOKIE_CONFIG.accessToken.options
      );
    }

    if (refToken) {
      response.cookies.set(
        COOKIE_CONFIG.refreshToken.name,
        refToken,
        COOKIE_CONFIG.refreshToken.options
      );
    }

    return response;
  } catch (err) {
    logger.error('[Google OAuth BFF Callback Error]', err);
    return NextResponse.redirect(new URL('/login?error=oauth_server_error', clientBaseUrl));
  }
}

