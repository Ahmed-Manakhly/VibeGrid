import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { vibeRepository, deleteVibeUseCase } from "@/shared/infrastructure/di-container";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = await vibeRepository.getPostById(params.id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const result = await deleteVibeUseCase.execute(params.id, session.user.id);
    if (!result.success) {
      return NextResponse.json({ error: result.error.message || "Failed to delete post" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
