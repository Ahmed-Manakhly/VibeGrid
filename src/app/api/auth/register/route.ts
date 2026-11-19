import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, passwordConfirm, name, agreedToPolicy } = body;

    const authRes = await authServiceFetch('/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        passwordConfirm: passwordConfirm || password,
        name,
        agreedToPolicy: Boolean(agreedToPolicy),
      }),
    });

    const isSuccess = authRes.ok && (authRes.data?.status === 'success' || authRes.data?.success === true);

    if (!isSuccess) {
      const errorMessage = authRes.data?.error || authRes.data?.message || authRes.data?.data?.message || 'Registration failed';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: authRes.status || 400 }
      );
    }

    const resData = authRes.data?.data || authRes.data;
    const requiresEmailVerification = resData?.requiresEmailVerification ?? true; // Default to true if manual registration

    return NextResponse.json({
      success: true,
      message: resData?.message || 'Account created successfully. Verification required.',
      requiresEmailVerification,
      data: resData,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Registration error' },
      { status: 500 }
    );
  }
}

