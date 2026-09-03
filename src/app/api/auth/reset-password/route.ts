import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, newPassword, confirmPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Email, OTP code, and new password are required' },
        { status: 400 }
      );
    }

    const authRes = await authServiceFetch('/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp,
        newPassword,
        confirmPassword: confirmPassword || newPassword,
      }),
    });

    const isSuccess = authRes.ok && (authRes.data?.status === 'success' || authRes.data?.success === true);

    if (!isSuccess) {
      const errorMessage = authRes.data?.error || authRes.data?.message || authRes.data?.data?.message || 'Password reset failed';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: authRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: authRes.data?.data?.message || authRes.data?.message || 'Password reset successfully. You can now log in.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
