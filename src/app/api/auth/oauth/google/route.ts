import { NextRequest, NextResponse } from 'next/server';
import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';

export async function GET(req: NextRequest) {
  const { apiBaseUrl } = EnvConfigRepository.getEndpoints();
  const targetUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/auth/oauth/google`;
  return NextResponse.redirect(targetUrl);
}

