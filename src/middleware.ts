import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessTokenRS256 } from '@/lib/auth/jwt.verifier';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';
import { EdgeLogger } from '@/shared/infrastructure/EdgeLogger';
import { ILogger } from '@/shared/application/ports/ILogger';

const logger: ILogger = new EdgeLogger('vibegrid-middleware');

const PROTECTED_ROUTES = ['/profile', '/settings', '/create-post', '/notifications', '/messages', '/bookmarks'];
const AUTH_ONLY_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
const EXEMPT_FROM_PROFILE_CHECK = [
  '/api',
  '/logout',
  '/_next',
  '/static',
  '/favicon.ico',
];

import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';

async function attemptSilentRefresh(refreshToken: string, requestUrl: string) {
  try {
    const origin = new URL(requestUrl).origin;
    const res = await fetch(`${origin}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${COOKIE_CONFIG.refreshToken.name}=${refreshToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data && (data.success || data.data?.accessToken)) {
      const payload = data.data || data;
      return {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // 0. Request Correlation Tracking (X-Request-ID)
  let requestId = req.headers.get('x-request-id');
  if (!requestId || typeof requestId !== 'string' || requestId.trim().length === 0) {
    requestId = crypto.randomUUID();
  } else {
    requestId = requestId.trim().replace(/[^a-zA-Z0-9\-_.]/g, '');
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-request-id', requestId);

  // 0. Bypass static assets & Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set('x-request-id', requestId);
    return res;
  }

  // 1. CSRF & Origin Guard for state-changing HTTP methods (POST, PUT, PATCH, DELETE)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host');

    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host && !originHost.includes('localhost') && !originHost.includes('127.0.0.1')) {
        return NextResponse.json(
          { error: 'CSRF Forbidden: Origin header mismatch' },
          { status: 403 }
        );
      }
    } else if (referer && host) {
      const refererHost = new URL(referer).host;
      if (refererHost !== host && !refererHost.includes('localhost') && !refererHost.includes('127.0.0.1')) {
        return NextResponse.json(
          { error: 'CSRF Forbidden: Referer header mismatch' },
          { status: 403 }
        );
      }
    }
  }

  // 2. Token Extraction & Verification
  const accessToken = req.cookies.get(COOKIE_CONFIG.accessToken.name)?.value;
  const refreshToken = req.cookies.get(COOKIE_CONFIG.refreshToken.name)?.value;

  let payload = accessToken ? await verifyAccessTokenRS256(accessToken) : null;
  let refreshedTokens: { accessToken: string; refreshToken: string } | null = null;

  logger.debug('[AUTH_FORENSIC_TRACE]', { requestId, pathname, method, hasAccessCookie: Boolean(accessToken), accessValid: Boolean(payload), hasRefreshCookie: Boolean(refreshToken) });

  // 3. Silent Access Token Refresh when access_token is expired/missing but refresh_token exists
  if (!payload && refreshToken) {
    logger.debug('[AUTH_FORENSIC_TRACE] Attempting silent refresh', { requestId, pathname });
    refreshedTokens = await attemptSilentRefresh(refreshToken, req.url);
    if (refreshedTokens && refreshedTokens.accessToken) {
      payload = await verifyAccessTokenRS256(refreshedTokens.accessToken);
      requestHeaders.set('x-refreshed-access-token', refreshedTokens.accessToken);
      logger.info('[AUTH_FORENSIC_TRACE] Silent refresh success', { requestId, pathname, payloadValid: Boolean(payload) });
    } else {
      logger.warn('[AUTH_FORENSIC_TRACE] Silent refresh failed', { requestId, pathname });
    }
  }

  // Helper to apply refreshed cookies to responses
  const applyRefreshedCookies = (response: NextResponse) => {
    if (refreshedTokens) {
      response.cookies.set(
        COOKIE_CONFIG.accessToken.name,
        refreshedTokens.accessToken,
        COOKIE_CONFIG.accessToken.options
      );
      response.cookies.set(
        COOKIE_CONFIG.refreshToken.name,
        refreshedTokens.refreshToken,
        COOKIE_CONFIG.refreshToken.options
      );
      logger.debug('[AUTH_FORENSIC_TRACE] Applied refreshed cookies', { requestId, pathname });
    }
    return response;
  };

  // Helper to clear invalid auth cookies
  const clearAuthCookies = (response: NextResponse) => {
    logger.debug('[AUTH_FORENSIC_TRACE] Clearing auth cookies', { requestId, pathname });
    response.cookies.delete(COOKIE_CONFIG.accessToken.name);
    response.cookies.delete(COOKIE_CONFIG.refreshToken.name);
    return response;
  };

  // 4. Auth-only routes (/login, /register) -> Redirect to homepage if authenticated
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname);
  if (isAuthOnlyRoute) {
    if (req.nextUrl.searchParams.get('clear') === 'true' || req.nextUrl.searchParams.get('logout') === 'true') {
      const res = NextResponse.next({ request: { headers: requestHeaders } });
      return clearAuthCookies(res);
    }
    if (payload) {
      logger.info('[AUTH_FORENSIC_TRACE] Redirecting auth-only route to home', { requestId, pathname });
      return applyRefreshedCookies(NextResponse.redirect(new URL('/', req.url)));
    }
  }

  // 5. Protected routes (/profile, /profile/edit, /settings, /create-post, /notifications, /messages, /bookmarks)
  // Note: /profile/:username is public; only exact /profile and /profile/edit require authentication
  const isProfileProtected = pathname === '/profile' || pathname === '/profile/edit' || pathname.startsWith('/profile/edit/');
  const isOtherProtected = ['/settings', '/create-post', '/notifications', '/messages', '/bookmarks'].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isProtectedRoute = isProfileProtected || isOtherProtected;

  if (isProtectedRoute && !payload) {
    logger.info('[AUTH_FORENSIC_TRACE] Redirecting unauthenticated user from protected route to login', { requestId, pathname });
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    loginUrl.searchParams.set('clear', 'true');
    return clearAuthCookies(NextResponse.redirect(loginUrl));
  }

  const response = applyRefreshedCookies(NextResponse.next({ request: { headers: requestHeaders } }));
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};