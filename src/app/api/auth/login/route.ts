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

    if (!authRes.ok || !authRes.data?.success) {
      return NextResponse.json(
        { success: false, message: authRes.data?.message || 'Invalid credentials' },
        { status: authRes.status || 401 }
      );
    }

    let user = authRes.data?.data?.user;
    let tokens = authRes.data?.data?.tokens;

    // Fallback: If Auth Service sets tokens in cookies directly (set-cookie headers)
    if (!tokens && authRes.data?.user) {
      user = authRes.data.user;
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
      { success: false, message: error?.message || 'Login handler error' },
      { status: 500 }
    );
  }
}
