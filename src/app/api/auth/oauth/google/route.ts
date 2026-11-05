import { NextRequest, NextResponse } from 'next/server';
import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { publicApiBaseUrl } = EnvConfigRepository.getEndpoints();
  const targetUrl = `${publicApiBaseUrl.replace(/\/$/, '')}/api/auth/oauth/google`;
  return NextResponse.redirect(targetUrl);
}

