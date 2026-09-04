import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessTokenRS256 } from '@/lib/auth/jwt.verifier';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';

const PROTECTED_ROUTES = ['/profile', '/settings', '/create-post'];
const AUTH_ONLY_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};