import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;

    const authRes = await authServiceFetch('/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (!authRes.ok || !authRes.data?.success) {
      return NextResponse.json(
        { success: false, message: authRes.data?.message || 'Registration failed' },
        { status: authRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: authRes.data.message || 'Account created successfully. Verification required.',
      data: authRes.data.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Registration error' },
      { status: 500 }
    );
  }
}
