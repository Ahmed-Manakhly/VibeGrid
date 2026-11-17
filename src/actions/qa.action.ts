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

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error("Failed to unaccept solution", error, { questionId });
    return { success: false, error: error.message || "Failed to unaccept solution." };
  }
}
