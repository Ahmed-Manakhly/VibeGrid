import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { toggleBookmarkUseCase } from "@/shared/infrastructure/di-container";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: postId } = await params;
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const result = await toggleBookmarkUseCase.execute(postId, session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to toggle bookmark" }, { status: 500 });
  }
}

