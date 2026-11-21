"use server";

import { getCurrentSession } from "@/lib/auth/server";
import { acceptSolutionUseCase, unacceptSolutionUseCase, cacheService, logger } from "@/shared/infrastructure/di-container";
import { revalidatePath } from "next/cache";

export async function acceptSolutionAction(questionId: string, answerCommentId: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized. Please log in to accept a solution." };
    }

    const result = await acceptSolutionUseCase.execute({
      questionId,
      answerCommentId,
      authorId: session.user.id,
    });

    revalidatePath(`/post/${questionId}`);
    revalidatePath(`/explore/${questionId}`);
    revalidatePath("/explore");
    revalidatePath("/");

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
          commentId: answerCommentId,
          isSolution: true,
          timestamp: Date.now(),
        });
        await (cacheService as any).publish("realtime:feed", signalPayload);
      }
    } catch (pubErr: any) {
      logger.warn("Failed to publish solution_toggled event", { error: pubErr?.message });
    }

    // Notify the comment author that their answer was accepted as verified solution
    try {
      const { prisma } = await import("@/shared/infrastructure/prisma");
      const { notificationRepository } = await import("@/shared/infrastructure/di-container");
      const answerComment = await prisma.comment.findUnique({
        where: { id: answerCommentId },
        select: { authorId: true },
      });
      if (answerComment && answerComment.authorId && answerComment.authorId !== session.user.id) {
        const notif = await notificationRepository.create({
          userId: answerComment.authorId,
          creatorId: session.user.id,
          type: "SOLUTION_ACCEPTED" as any,
          postId: questionId,
          commentId: answerCommentId,
        });
        if (cacheService && typeof (cacheService as any).publish === "function") {
          const notifPayload = JSON.stringify({
            userId: answerComment.authorId,
            notification: {
              id: notif.id,
              type: "SOLUTION_ACCEPTED",
              userId: answerComment.authorId,
              creatorId: session.user.id,
              creatorName: session.user.name,
              creatorUsername: session.user.username,
              postId: questionId,
              commentId: answerCommentId,
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          });
          await (cacheService as any).publish("realtime:notification", notifPayload);
        }
      }
    } catch (solNotifErr: any) {
      logger.warn("Failed to create SOLUTION_ACCEPTED notification", { error: solNotifErr?.message });
    }

    return {
      success: true,
      solvedAt: result.solvedAt,
      acceptedAnswerId: result.acceptedAnswerId,
    };
  } catch (error: any) {
    logger.error("Failed to accept solution", error, { questionId, answerCommentId });
    return { success: false, error: error.message || "Failed to accept solution." };
  }
}

export async function unacceptSolutionAction(questionId: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    await unacceptSolutionUseCase.execute({
      questionId,
      authorId: session.user.id,
    });

    revalidatePath(`/post/${questionId}`);
    revalidatePath(`/explore/${questionId}`);
    revalidatePath("/explore");
    revalidatePath("/");

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
          isSolution: false,
          timestamp: Date.now(),
        });
        await (cacheService as any).publish("realtime:feed", signalPayload);
      }
    } catch (pubErr: any) {
      logger.warn("Failed to publish solution_toggled event", { error: pubErr?.message });
    }

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error("Failed to unaccept solution", error, { questionId });
    return { success: false, error: error.message || "Failed to unaccept solution." };
  }
}
