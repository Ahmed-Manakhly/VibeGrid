import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(COOKIE_CONFIG.refreshToken.name)?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: 'Refresh token missing' },
        { status: 401 }
      );
    }

    const authRes = await authServiceFetch('/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    if (!authRes.ok || !authRes.data?.success) {
      const response = NextResponse.json(
        { success: false, message: authRes.data?.message || 'Session expired' },
        { status: 401 }
      );
      response.cookies.delete(COOKIE_CONFIG.accessToken.name);
      response.cookies.delete(COOKIE_CONFIG.refreshToken.name);
      return response;
    }

    const { tokens } = authRes.data.data;

    const response = NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
    });

    if (tokens?.accessToken) {
      response.cookies.set(
        COOKIE_CONFIG.accessToken.name,
        tokens.accessToken,
        COOKIE_CONFIG.accessToken.options
      );
    }

    if (tokens?.refreshToken) {
      response.cookies.set(
        COOKIE_CONFIG.refreshToken.name,
        tokens.refreshToken,
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
