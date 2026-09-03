import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', req.url));
  }

  try {
    const authServiceUrl = process.env.INTERNAL_API_GATEWAY_URL || 'http://localhost:8000';
    const authRes = await fetch(`${authServiceUrl}/api/auth/oauth/github/callback?code=${encodeURIComponent(code)}`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    const data = await authRes.json();

    if (!authRes.ok || !data.success) {
      return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url));
    }

    const { user, accessToken, refreshToken } = data.data || {};

    if (user) {
      const userId = user.id || user._id;
      const displayName = user.name || user.email.split('@')[0];
      const username = displayName.toLowerCase().replace(/\s+/g, '_');
      const { prisma } = await import('@/shared/infrastructure/prisma');

      await prisma.user.upsert({
        where: { id: userId },
        update: { email: user.email, name: displayName },
        create: {
          id: userId,
          email: user.email,
          name: displayName,
          username,
          role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
        },
      }).catch((err) => console.error('[OAuth DB Sync Warning]', err));
    }

    const response = NextResponse.redirect(new URL('/', req.url));

    let accToken = accessToken;
    let refToken = refreshToken;

    if (!accToken && authRes.headers) {
      const getCookieVal = (name: string) => {
        const rawCookies = (authRes.headers as any).getSetCookie ? (authRes.headers as any).getSetCookie() : [authRes.headers.get('set-cookie') || ''];
        for (const header of rawCookies) {
          const match = header.match(new RegExp(`${name}=([^;]+)`));
          if (match) return match[1];
        }
        return null;
      };
      accToken = getCookieVal(COOKIE_CONFIG.accessToken.name);
      refToken = getCookieVal(COOKIE_CONFIG.refreshToken.name);
    }

    if (accToken) {
      response.cookies.set(
        COOKIE_CONFIG.accessToken.name,
        accToken,
        COOKIE_CONFIG.accessToken.options
      );
    }

    if (refToken) {
      response.cookies.set(
        COOKIE_CONFIG.refreshToken.name,
        refToken,
        COOKIE_CONFIG.refreshToken.options
      );
    }

    return response;
  } catch (err) {
    console.error('[GitHub OAuth BFF Callback Error]', err);
    return NextResponse.redirect(new URL('/login?error=oauth_server_error', req.url));
  }
}
