import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    const authRes = await authServiceFetch('/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });

    if (!authRes.ok || !authRes.data?.success) {
      return NextResponse.json(
        { success: false, message: authRes.data?.message || 'Email verification failed' },
        { status: authRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: authRes.data.message || 'Email verified successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Verification error' },
      { status: 500 }
    );
  }
}
