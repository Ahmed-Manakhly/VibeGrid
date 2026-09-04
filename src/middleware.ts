import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessTokenRS256 } from '@/lib/auth/jwt.verifier';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';

const PROTECTED_ROUTES = ['/profile', '/settings', '/create-post'];
const AUTH_ONLY_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];
const EXEMPT_FROM_PROFILE_CHECK = [
  '/complete-profile',
  '/api',
  '/logout',
  '/_next',
  '/static',
  '/favicon.ico',
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 0. Bypass static assets & Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_CONFIG.accessToken.name)?.value;
  const payload = token ? await verifyAccessTokenRS256(token) : null;

  // 1. If user is authenticated and trying to access auth-only routes -> Redirect to /
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname);
  if (isAuthOnlyRoute && payload) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // 2. Protect private routes
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !payload) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Profile Completion Gate for authenticated users
  if (payload) {
    const isExempt = EXEMPT_FROM_PROFILE_CHECK.some((route) =>
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (!isExempt) {
      try {
        const { prisma } = await import('@/shared/infrastructure/prisma');
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { username: true, name: true },
        });

        const isProfileComplete = Boolean(
          dbUser &&
            dbUser.username &&
            dbUser.username.trim() !== '' &&
            !dbUser.username.startsWith('user_') &&
            dbUser.name &&
            dbUser.name.trim() !== ''
        );

        if (!isProfileComplete) {
          const completeUrl = new URL('/complete-profile', req.url);
          if (pathname !== '/') {
            completeUrl.searchParams.set('callbackUrl', pathname);
          }
          return NextResponse.redirect(completeUrl);
        }
      } catch (err) {
        // Fallback to allow next on database query error
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};