import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/server';

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({
        success: true,
        isAuthenticated: false,
        user: null,
      });
    }

    const { prisma } = await import('@/shared/infrastructure/prisma');
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, name: true, email: true, image: true, role: true },
    });

    return NextResponse.json({
      success: true,
      isAuthenticated: true,
      user: {
        ...session.user,
        username: dbUser?.username || session.user.name || session.user.email.split('@')[0],
        name: dbUser?.name || session.user.name,
        image: dbUser?.image || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, isAuthenticated: false, user: null, message: error?.message },
      { status: 500 }
    );
  }
}
