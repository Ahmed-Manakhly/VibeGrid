import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    const authRes = await authServiceFetch('/create-email-token', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    const isSuccess = authRes.ok && (authRes.data?.status === 'success' || authRes.data?.success === true);

    if (!isSuccess) {
      const errorMessage = authRes.data?.error || authRes.data?.message || authRes.data?.data?.message || 'Failed to resend verification code';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: authRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: authRes.data?.data?.message || 'Verification code resent successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Resend verification error' },
      { status: 500 }
    );
  }
}
