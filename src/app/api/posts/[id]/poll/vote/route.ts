import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { pollRepository, cacheService, notificationRepository, logger } from "@/shared/infrastructure/di-container";
import { prisma } from "@/shared/infrastructure/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { id: targetId } = await params;
    if (!targetId) {
      return NextResponse.json({ success: false, error: "Post or Poll ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { optionId, optionIndex } = body;

    // Find poll by postId or poll id
    const pollRecord = await prisma.poll.findFirst({
      where: {
        OR: [{ postId: targetId }, { id: targetId }],
      },
      include: {
        options: { orderBy: { index: "asc" } },
        post: { select: { id: true, authorId: true } },
      },
    });

    if (!pollRecord) {
      return NextResponse.json({ success: false, error: "Poll not found for the given post" }, { status: 404 });
    }

    // Resolve target optionId
    let resolvedOptionId = optionId;
    if (!resolvedOptionId && typeof optionIndex === "number") {
      const optionByIndex = pollRecord.options[optionIndex];
      if (!optionByIndex) {
        return NextResponse.json({ success: false, error: `Invalid option index: ${optionIndex}` }, { status: 400 });
      }
      resolvedOptionId = optionByIndex.id;
    }

    if (!resolvedOptionId) {
      return NextResponse.json({ success: false, error: "optionId or optionIndex is required" }, { status: 400 });
    }

    const voteResult = await pollRepository.castVote({
      pollId: pollRecord.id,
      optionId: resolvedOptionId,
      userId: session.user.id,
    });

    // Invalidate cached tallies
    if (cacheService?.delete) {
      await cacheService.delete(`poll:${pollRecord.id}:tallies`);
    }

    // Broadcast realtime:feed event
    try {
      if (cacheService && typeof (cacheService as any).publish === "function") {
        const signalPayload = JSON.stringify({
          type: "poll_voted",
          postId: pollRecord.postId,
          pollId: pollRecord.id,
          pollTallies: voteResult.tallies,
          timestamp: Date.now(),
        });
        await (cacheService as any).publish("realtime:feed", signalPayload);
      }
    } catch (feedPubErr: any) {
      logger.warn("Failed to broadcast poll_voted signal", { error: feedPubErr?.message });
    }

    // Deliver notification to poll author if voter is not the author
    try {
      if (pollRecord.post?.authorId && pollRecord.post.authorId !== session.user.id) {
        await notificationRepository.create({
          userId: pollRecord.post.authorId,
          creatorId: session.user.id,
          type: "POLL_VOTE" as any,
          postId: pollRecord.postId,
        });
      }
    } catch (notifErr: any) {
      logger.warn("Failed to deliver poll vote notification", { error: notifErr?.message });
    }

    return NextResponse.json({ success: true, tallies: voteResult.tallies });
  } catch (error: any) {
    if (error.message?.includes("already voted") || error.code === "P2002") {
      return NextResponse.json({ success: false, error: "You have already voted in this poll." }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: error.message || "Failed to record vote" }, { status: 500 });
  }
}

