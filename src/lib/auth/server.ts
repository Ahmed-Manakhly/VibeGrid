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

export async function getCurrentSession(): Promise<SessionResult> {
  const cookieStore = await cookies();
  let token = cookieStore.get(COOKIE_CONFIG.accessToken.name)?.value;

  if (!token) {
    const { headers } = await import('next/headers');
    const headerStore = await headers();
    const authHeader = headerStore.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  let payload = token ? await verifyAccessTokenRS256(token) : null;

  // If access token is missing or expired, attempt silent refresh using refresh_token cookie
  if (!payload) {
    const refreshToken = cookieStore.get(COOKIE_CONFIG.refreshToken.name)?.value;
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
            } catch {
              // Read-only context (RSC page rendering); client SessionProvider / API route will persist on next request
            }
          }
        }
      } catch {
        // Silent catch for network failure during refresh
      }
    }
  }

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
