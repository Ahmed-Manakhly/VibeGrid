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

  if (!token) {
    return { isAuthenticated: false, user: null };
  }

  const payload = await verifyAccessTokenRS256(token);
  if (!payload) {
    return { isAuthenticated: false, user: null };
  }

  let name = payload.email.split('@')[0];
  try {
    const { prisma } = await import('@/shared/infrastructure/prisma');
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { name: true },
    });
    if (dbUser?.name) {
      name = dbUser.name;
    }
  } catch {
    // fallback to email prefix if DB fails
  }

  return {
    isAuthenticated: true,
    user: {
      id: payload.userId,
      email: payload.email,
      name,
      role: payload.role,
      isEmailVerified: payload.isEmailVerified,
    },
  };
}

export async function getAuthenticatedUser(): Promise<SafeUser | null> {
  const session = await getCurrentSession();
  return session.user;
}
