import { cookies } from 'next/headers';
import { verifyAccessTokenRS256, AuthJwtPayload } from './jwt.verifier';
import { COOKIE_CONFIG } from './cookie.config';

export interface SafeUser {
  id: string;
  email: string;
  name?: string;
  username?: string;
  image?: string | null;
  role: string;
  isEmailVerified: boolean;
}

export interface SessionResult {
  isAuthenticated: boolean;
  user: SafeUser | null;
  accessToken?: string;
}

import { logger } from '@/shared/infrastructure/di-container';

export async function getCurrentSession(): Promise<SessionResult> {
  const cookieStore = await cookies();
  let token = cookieStore.get(COOKIE_CONFIG.accessToken.name)?.value;
  let payload: AuthJwtPayload | null = token ? await verifyAccessTokenRS256(token) : null;

  const { headers } = await import('next/headers');
  const headerStore = await headers();
  const reqId = headerStore.get('x-request-id') || 'N/A';
  const refreshedToken = headerStore.get('x-refreshed-access-token');

  logger.info('[AUTH_FORENSIC_TRACE] getCurrentSession start', {
    reqId,
    hasAccessCookie: Boolean(token),
    accessValid: Boolean(payload),
    hasHeaderRefreshedToken: Boolean(refreshedToken),
  });

  if (refreshedToken) {
    const refreshedPayload = await verifyAccessTokenRS256(refreshedToken);
    if (refreshedPayload) {
      token = refreshedToken;
      payload = refreshedPayload;
      logger.info('[AUTH_FORENSIC_TRACE] getCurrentSession accepted header refreshed token', { reqId });
    } else {
      logger.warn('[AUTH_FORENSIC_TRACE] getCurrentSession header refreshed token INVALID', { reqId });
    }
  }

  if (!payload && !token) {
    const authHeader = headerStore.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      payload = await verifyAccessTokenRS256(token);
    }
  }

  // If access token is missing or expired, attempt silent refresh using refresh_token cookie
  if (!payload) {
    const refreshToken = cookieStore.get(COOKIE_CONFIG.refreshToken.name)?.value;
    logger.info('[AUTH_FORENSIC_TRACE] getCurrentSession entering fallback silent refresh', {
      reqId,
      hasRefreshCookie: Boolean(refreshToken),
    });

    if (refreshToken) {
      try {
        const { EnvConfigRepository } = await import('@/modules/config/infrastructure/EnvConfigRepository');
        const { apiBaseUrl } = EnvConfigRepository.getEndpoints();
        const refreshRes = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: `refresh_token=${refreshToken}; vibegrid_refresh_token=${refreshToken}`,
          },
          body: JSON.stringify({ refreshToken }),
          cache: 'no-store',
        });

        logger.info('[AUTH_FORENSIC_TRACE] getCurrentSession fallback refresh response', {
          reqId,
          status: refreshRes.status,
          ok: refreshRes.ok,
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newTokens = refreshData?.data || refreshData;
          const freshAccessToken = newTokens?.accessToken;
          const freshRefreshToken = newTokens?.refreshToken || newTokens?.tokens?.refreshToken;
          if (typeof freshAccessToken === 'string' && freshAccessToken.length > 0) {
            token = freshAccessToken;
            payload = await verifyAccessTokenRS256(freshAccessToken);

            // Persist rotated tokens to browser cookies when in mutable context (Route Handlers / Server Actions)
            try {
              cookieStore.set(
                COOKIE_CONFIG.accessToken.name,
                freshAccessToken,
                COOKIE_CONFIG.accessToken.options
              );
              if (typeof freshRefreshToken === 'string' && freshRefreshToken.length > 0) {
                cookieStore.set(
                  COOKIE_CONFIG.refreshToken.name,
                  freshRefreshToken,
                  COOKIE_CONFIG.refreshToken.options
                );
              }
              logger.info('[AUTH_FORENSIC_TRACE] getCurrentSession persisted fallback refresh cookies', { reqId });
            } catch {
              logger.info('[AUTH_FORENSIC_TRACE] getCurrentSession cookieStore.set readonly context', { reqId });
            }
          }
        }
      } catch (err: any) {
        logger.error('[AUTH_FORENSIC_TRACE] getCurrentSession fallback refresh error', { reqId, error: err?.message });
      }
    }
  }

  logger.info('[AUTH_FORENSIC_TRACE] getCurrentSession end', { reqId, isAuthenticated: Boolean(payload) });

  if (!payload) {
    return { isAuthenticated: false, user: null };
  }

  let name = payload.email.split('@')[0];
  let username: string | undefined = undefined;
  try {
    const { getProfileUseCase } = await import('@/shared/infrastructure/di-container');
    const dbUser: any = await getProfileUseCase.execute(payload.userId).catch(() => null);
    if (dbUser) {
      if (dbUser.name) name = dbUser.name;
      if (dbUser.username) username = dbUser.username;
    }
  } catch {
    // fallback if DB fails
  }

  return {
    isAuthenticated: true,
    accessToken: token,
    user: {
      id: payload.userId,
      email: payload.email,
      name,
      username,
      role: payload.role,
      isEmailVerified: payload.isEmailVerified,
    },
  };
}

export async function getAuthenticatedUser(): Promise<SafeUser | null> {
  const session = await getCurrentSession();
  return session.user;
}
