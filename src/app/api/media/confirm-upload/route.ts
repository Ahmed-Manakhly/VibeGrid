import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/server';

const GATEWAY_URL = process.env.INTERNAL_API_GATEWAY_URL || process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8000';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const token = req.cookies.get('access_token')?.value;

    const gatewayRes = await fetch(`${GATEWAY_URL}/api/media/confirm-upload`, {
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
    console.error('[BFF Media Confirm Upload Error]', error);
    return NextResponse.json({ success: false, error: error?.message || 'Media service confirmation failed' }, { status: 500 });
  }
}
