import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/server';

export const dynamic = "force-dynamic";

import { logger } from '@/shared/infrastructure/di-container';

import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';

export async function GET(req: Request) {
  try {
    const reqId = req.headers.get('x-request-id') || 'N/A';
    const hasHeaderRefreshedToken = Boolean(req.headers.get('x-refreshed-access-token'));
    logger.info('[AUTH_FORENSIC_TRACE] GET /api/auth/me start', { reqId, hasHeaderRefreshedToken });

    const session = await getCurrentSession();
    logger.info('[AUTH_FORENSIC_TRACE] GET /api/auth/me session result', { reqId, isAuthenticated: session.isAuthenticated });

    if (!session.isAuthenticated || !session.user) {
      const response = NextResponse.json({
        success: true,
        isAuthenticated: false,
        user: null,
      });
      response.cookies.delete(COOKIE_CONFIG.accessToken.name);
      response.cookies.delete(COOKIE_CONFIG.refreshToken.name);
      return response;
    }

    const { getProfileUseCase } = await import('@/shared/infrastructure/di-container');
    const dbUser: any = await getProfileUseCase.execute(session.user.id).catch(() => null);

    if (!dbUser) {
      logger.warn('[AUTH_FORENSIC_TRACE] GET /api/auth/me user missing from DB - purging session', { reqId, userId: session.user.id });
      const response = NextResponse.json({
        success: true,
        isAuthenticated: false,
        user: null,
      });
      response.cookies.delete(COOKIE_CONFIG.accessToken.name);
      response.cookies.delete(COOKIE_CONFIG.refreshToken.name);
      return response;
    }

    return NextResponse.json({
      success: true,
      isAuthenticated: true,
      user: {
        ...session.user,
        username: dbUser?.username || session.user.username || `user_${session.user.email.split('@')[0]}`,
        name: dbUser?.name || session.user.name,
        bio: dbUser?.bio || null,
        image: dbUser?.image || null,
        isPolicyAccepted: Boolean(dbUser?.isPolicyAccepted),
      },
    });
  } catch (error: any) {
    const response = NextResponse.json(
      { success: false, isAuthenticated: false, user: null, message: error?.message },
      { status: 500 }
    );
    response.cookies.delete(COOKIE_CONFIG.accessToken.name);
    response.cookies.delete(COOKIE_CONFIG.refreshToken.name);
    return response;
  }
}
