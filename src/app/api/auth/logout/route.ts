import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(COOKIE_CONFIG.refreshToken.name)?.value;
    const accessToken = req.cookies.get(COOKIE_CONFIG.accessToken.name)?.value;

    if (refreshToken) {
      await authServiceFetch('/logout', {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        body: JSON.stringify({ refreshToken }),
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    response.cookies.delete(COOKIE_CONFIG.accessToken.name);
    response.cookies.delete(COOKIE_CONFIG.refreshToken.name);

    return response;
  } catch (error: any) {
    const response = NextResponse.json({
      success: true,
      message: 'Logged out locally',
    });
    response.cookies.delete(COOKIE_CONFIG.accessToken.name);
    response.cookies.delete(COOKIE_CONFIG.refreshToken.name);
    return response;
  }
}
