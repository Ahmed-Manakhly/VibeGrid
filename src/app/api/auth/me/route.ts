import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/server';

export const dynamic = "force-dynamic";

import { logger } from '@/shared/infrastructure/di-container';

export async function GET(req: Request) {
  try {
    const reqId = req.headers.get('x-request-id') || 'N/A';
    const hasHeaderRefreshedToken = Boolean(req.headers.get('x-refreshed-access-token'));
    logger.info('[AUTH_FORENSIC_TRACE] GET /api/auth/me start', { reqId, hasHeaderRefreshedToken });

    const session = await getCurrentSession();
    logger.info('[AUTH_FORENSIC_TRACE] GET /api/auth/me session result', { reqId, isAuthenticated: session.isAuthenticated });

    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({
        success: true,
        isAuthenticated: false,
        user: null,
      });
    }

    const { getProfileUseCase } = await import('@/shared/infrastructure/di-container');
    const dbUser: any = await getProfileUseCase.execute(session.user.id).catch(() => null);

    return NextResponse.json({
      success: true,
      isAuthenticated: true,
      user: {
        ...session.user,
        username: dbUser?.username || session.user.username || `user_${session.user.email.split('@')[0]}`,
        name: dbUser?.name || session.user.name,
        image: dbUser?.image || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, isAuthenticated: false, user: null, message: error?.message },
      { status: 500 }
    );
  }
}
