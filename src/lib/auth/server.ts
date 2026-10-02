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
        const { refreshSessionCoordinator } = await import('@/modules/auth/infrastructure/refreshCoordinator');
        const refreshResult = await refreshSessionCoordinator.refresh(refreshToken);

        logger.info('[AUTH_FORENSIC_TRACE] getCurrentSession fallback refresh response', {
          reqId,
          status: refreshResult.status,
          ok: refreshResult.success,
        });

        if (refreshResult.success && refreshResult.accessToken) {
          const freshAccessToken = refreshResult.accessToken;
          const freshRefreshToken = refreshResult.refreshToken;

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
    const { prisma } = await import('@/shared/infrastructure/prisma');
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { name: true, username: true },
    }).catch(() => null);
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
