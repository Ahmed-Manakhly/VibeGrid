import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/server';
import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';
import { logger } from '@/shared/infrastructure/di-container';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const token = session.accessToken || req.cookies.get('access_token')?.value;

    const body = await req.json();

    const { apiBaseUrl } = EnvConfigRepository.getEndpoints();
    const gatewayRes = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/media/upload-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await gatewayRes.json();
    return NextResponse.json(data, { status: gatewayRes.status });
  } catch (error: any) {
    logger.error('[BFF Media Upload Intent Error]', error);
    return NextResponse.json({ success: false, error: error?.message || 'Media service request failed' }, { status: 500 });
  }
}

