import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const authRes = await authServiceFetch('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const isSuccess = authRes.ok && (authRes.data?.status === 'success' || authRes.data?.success === true);
    console.log('[BFF Login Debug] authRes.status:', authRes.status, 'isSuccess:', isSuccess, 'authRes.data:', JSON.stringify(authRes.data));

    if (!isSuccess) {
      const errorMessage = authRes.data?.error || authRes.data?.message || authRes.data?.data?.message || 'Invalid credentials';
      const isUnverified = typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('not verified');

      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          isEmailUnverified: isUnverified,
          email: isUnverified ? email : undefined
        },
        { status: authRes.status || 401 }
      );
    }

    const result = authRes.data?.data || authRes.data;
    let user = result?.user;
    let accessToken = result?.accessToken || result?.tokens?.accessToken;
    let refreshToken = result?.refreshToken || result?.tokens?.refreshToken;

    // Fallback: Parse Set-Cookie header sent by Auth Microservice
    if (!accessToken && authRes.headers) {
      const headers = authRes.headers;
      const getCookieVal = (name: string) => {
        const rawCookies = (headers as any).getSetCookie ? (headers as any).getSetCookie() : [headers.get('set-cookie') || ''];
        for (const header of rawCookies) {
          const match = header.match(new RegExp(`${name}=([^;]+)`));
          if (match) return match[1];
        }
        return null;
      };
      accessToken = getCookieVal(COOKIE_CONFIG.accessToken.name);
      refreshToken = getCookieVal(COOKIE_CONFIG.refreshToken.name);
    }

    console.log('[BFF Login Tokens Debug] accessToken found:', !!accessToken, 'refreshToken found:', !!refreshToken);

    if (user) {
      const { ProfileBootstrapService } = await import('@/modules/social/application/ProfileBootstrapService');
      await ProfileBootstrapService.bootstrapProfile({
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      }).catch((err) => console.error('[Login Profile Bootstrap Warning]', err));
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: user ? {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      } : null,
    });



    if (accessToken) {
      response.cookies.set(
        COOKIE_CONFIG.accessToken.name,
        accessToken,
        COOKIE_CONFIG.accessToken.options
      );
    }

    if (refreshToken) {
      response.cookies.set(
        COOKIE_CONFIG.refreshToken.name,
        refreshToken,
        COOKIE_CONFIG.refreshToken.options
      );
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Login handler error' },
      { status: 500 }
    );
  }
}
