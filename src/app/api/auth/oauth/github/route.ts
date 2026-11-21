import { NextRequest, NextResponse } from 'next/server';
import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';
import { logger } from '@/shared/infrastructure/di-container';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { apiBaseUrl } = EnvConfigRepository.getEndpoints();
    const targetUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/auth/oauth/github`;
    const res = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'manual',
      cache: 'no-store',
    });

    const location = res.headers.get('location');
    if (location) {
      return NextResponse.redirect(location);
    }

    logger.error('[OAuth GitHub Init Error] Missing Location header from Auth microservice', { status: res.status });
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = host.includes('localhost') ? 'http' : (req.headers.get('x-forwarded-proto') || 'https');
    return NextResponse.redirect(new URL('/login?error=oauth_init_failed', `${proto}://${host}`));
  } catch (err: any) {
    logger.error('[OAuth GitHub Init Exception]', err);
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
    const proto = host.includes('localhost') ? 'http' : (req.headers.get('x-forwarded-proto') || 'https');
    return NextResponse.redirect(new URL('/login?error=oauth_init_failed', `${proto}://${host}`));
  }
}

