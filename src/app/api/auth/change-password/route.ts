import { NextRequest, NextResponse } from 'next/server';
import { authServiceFetch } from '@/lib/auth/auth.client';
import { getCurrentSession } from '@/lib/auth/server';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPassword, newPassword, passwordConfirm } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (cookieHeader) headers['Cookie'] = cookieHeader;
    if (authHeader) headers['Authorization'] = authHeader;

    const authRes = await authServiceFetch('/change-password', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        currentPassword,
        newPassword,
        passwordConfirm: passwordConfirm || newPassword,
      }),
    });

    const isSuccess = authRes.ok && (authRes.data?.status === 'success' || authRes.data?.success === true);

    if (!isSuccess) {
      const errorMessage = authRes.data?.error || authRes.data?.message || authRes.data?.data?.message || 'Failed to change password';
      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: authRes.status || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: authRes.data?.data?.message || authRes.data?.message || 'Password changed successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
