import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    const authRes = await authServiceFetch('/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (!authRes.ok || !authRes.data?.success) {
      return NextResponse.json(
        { success: false, message: authRes.data?.message || 'Failed to resend verification code' },
        { status: authRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: authRes.data.message || 'Verification code resent successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Resend verification error' },
      { status: 500 }
    );
  }
}
