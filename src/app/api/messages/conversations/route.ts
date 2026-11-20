import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { getDbUserId } from "@/actions/user.action";
import { getConversationsUseCase } from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
    const cursor = searchParams.get("cursor") || undefined;

    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const dbUserId = await getDbUserId();
    if (!dbUserId) {
      return NextResponse.json({ success: false, error: "User not synced" }, { status: 401 });
    }

    const result = await getConversationsUseCase.execute(dbUserId, limit, cursor);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

