import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_CONFIG } from '@/lib/auth/cookie.config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get(COOKIE_CONFIG.accessToken.name)?.value;
    if (!accessToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      token: accessToken,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal error' }, { status: 500 });
  }
}
