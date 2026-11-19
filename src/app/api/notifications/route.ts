import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { getNotificationsUseCase, markAsReadUseCase } from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const [notificationsResult, unreadCount] = await Promise.all([
      getNotificationsUseCase.execute(session.user.id),
      getNotificationsUseCase.getUnreadCount(session.user.id)
    ]);
    return NextResponse.json({
      ...notificationsResult,
      unreadCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds } = body;
    if (!Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "notificationIds must be an array" }, { status: 400 });
    }

    const result = await markAsReadUseCase.execute(notificationIds);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to mark notifications as read" }, { status: 500 });
  }
}
