import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { acceptSolutionUseCase, cacheService, logger } from "@/shared/infrastructure/di-container";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { id: questionId } = await params;
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question Post ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { commentId, answerCommentId } = body;
    const targetCommentId = commentId || answerCommentId;

    if (!targetCommentId) {
      return NextResponse.json({ success: false, error: "commentId is required" }, { status: 400 });
    }

    const result = await acceptSolutionUseCase.execute({
      questionId,
      answerCommentId: targetCommentId,
      authorId: session.user.id,
    });

    if (cacheService?.delByPattern) {
      await cacheService.delByPattern("feed:query:*");
      await cacheService.delByPattern("timeline:*");
    }

    // Broadcast solution_toggled via Redis realtime:feed
    try {
      if (cacheService && typeof (cacheService as any).publish === "function") {
        const signalPayload = JSON.stringify({
          type: "solution_toggled",
          postId: questionId,
          commentId: targetCommentId,
          isSolution: true,
          timestamp: Date.now(),
        });
        await (cacheService as any).publish("realtime:feed", signalPayload);
      }
    } catch (pubErr: any) {
      logger.warn("Failed to publish solution_toggled event", { error: pubErr?.message });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to accept solution" }, { status: 500 });
  }
}

