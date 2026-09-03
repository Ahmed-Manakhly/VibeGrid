import { cookies } from 'next/headers';
import { verifyAccessTokenRS256, AuthJwtPayload } from './jwt.verifier';
import { COOKIE_CONFIG } from './cookie.config';

export interface SafeUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  isEmailVerified: boolean;
}

export interface SessionResult {
  isAuthenticated: boolean;
  user: SafeUser | null;
}

export async function getCurrentSession(): Promise<SessionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_CONFIG.accessToken.name)?.value;

  if (!token) {
    return { isAuthenticated: false, user: null };
  }

  const payload = await verifyAccessTokenRS256(token);
  if (!payload) {
    return { isAuthenticated: false, user: null };
  }

  return {
    isAuthenticated: true,
    user: {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      isEmailVerified: payload.isEmailVerified,
    },
  };
}

export async function getAuthenticatedUser(): Promise<SafeUser | null> {
  const session = await getCurrentSession();
  return session.user;
}
