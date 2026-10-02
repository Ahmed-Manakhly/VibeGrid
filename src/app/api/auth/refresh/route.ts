import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';
import { refreshSessionCoordinator } from '@/shared/infrastructure/di-container';

export async function POST(req: NextRequest) {
  try {
    let refreshToken = req.cookies.get(COOKIE_CONFIG.refreshToken.name)?.value;
    
    if (!refreshToken) {
      try {
        const body = await req.json().catch(() => ({}));
        refreshToken = body?.refreshToken;
      } catch {
        // ignore body JSON parse error
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token missing' },
        { status: 401 }
      );
    }

    // Delegate single-flight distributed locking and Auth Service rotation to the BFF coordinator
    const refreshResult = await refreshSessionCoordinator.refresh(refreshToken);

    if (!refreshResult.success) {
      const response = NextResponse.json(
        { success: false, message: refreshResult.message || 'Session expired' },
        { status: refreshResult.status || 401 }
      );
      response.cookies.delete(COOKIE_CONFIG.accessToken.name);
      response.cookies.delete(COOKIE_CONFIG.refreshToken.name);
      return response;
    }

    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: refreshResult.accessToken,
        refreshToken: refreshResult.refreshToken,
      },
    });

    if (refreshResult.accessToken) {
      response.cookies.set(
        COOKIE_CONFIG.accessToken.name,
        decodeURIComponent(refreshResult.accessToken),
        COOKIE_CONFIG.accessToken.options
      );
    }

    if (refreshResult.refreshToken) {
      response.cookies.set(
        COOKIE_CONFIG.refreshToken.name,
        decodeURIComponent(refreshResult.refreshToken),
        COOKIE_CONFIG.refreshToken.options
      );
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Refresh error' },
      { status: 500 }
    );
  }
}
