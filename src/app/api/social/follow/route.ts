import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { toggleFollowUseCase } from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const targetUserId = body.targetUserId || body.followingId;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    const result = await toggleFollowUseCase.execute(session.user.id, targetUserId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to toggle follow" }, { status: 500 });
  }
}
