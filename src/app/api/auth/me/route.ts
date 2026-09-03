import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/server';

export async function GET() {
  try {
    const session = await getCurrentSession();
    return NextResponse.json({
      success: true,
      isAuthenticated: session.isAuthenticated,
      user: session.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, isAuthenticated: false, user: null, message: error?.message },
      { status: 500 }
    );
  }
}
