import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      );
    }

    const authRes = await authServiceFetch('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    const isSuccess = authRes.ok && (authRes.data?.status === 'success' || authRes.data?.success === true);

    if (!isSuccess) {
      const errorMessage = authRes.data?.error || authRes.data?.message || authRes.data?.data?.message || 'Failed to send password reset code';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: authRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: authRes.data?.data?.message || authRes.data?.message || 'Password reset OTP code sent to your email',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
