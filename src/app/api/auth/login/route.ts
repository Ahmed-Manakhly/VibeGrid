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

    let user = authRes.data?.data?.user;
    let tokens = authRes.data?.data?.tokens;

    // Fallback: If Auth Service sets tokens in cookies directly (set-cookie headers)
    if (!tokens && authRes.data?.user) {
      user = authRes.data.user;
    }

    if (user) {
      const userId = user.id || user._id;
      const username = user.name ? user.name.toLowerCase().replace(/\s+/g, '_') : user.email.split('@')[0];
      const { prisma } = await import('@/shared/infrastructure/prisma');
      
      await prisma.user.upsert({
        where: { id: userId },
        update: { email: user.email, name: user.name },
        create: {
          id: userId,
          email: user.email,
          name: user.name || username,
          username,
          role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
        },
      }).catch((err) => console.error('[Login DB Sync Warning]', err));
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
