import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { toggleReGridUseCase } from "@/shared/infrastructure/di-container";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const vibeId = params.id;
    if (!vibeId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const result = await toggleReGridUseCase.execute(vibeId, session.user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message || "Failed to Re-Grid post" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      isReGridded: result.value.isReGridded,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
