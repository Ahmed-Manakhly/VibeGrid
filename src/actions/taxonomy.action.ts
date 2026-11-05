"use server";

import { getCurrentSession } from "@/lib/auth/server";
import { toggleFollowTagUseCase, tagFollowRepository, logger } from "@/shared/infrastructure/di-container";
import { revalidatePath } from "next/cache";

export async function toggleFollowTag(tagId: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized. Please log in to follow technologies." };
    }

    const result = await toggleFollowTagUseCase.execute(session.user.id, tagId);
    if (!result.success) {
      return { success: false, error: result.error || "Failed to toggle tag follow." };
    }

    revalidatePath("/explore");
    revalidatePath("/");

    return {
      success: true,
      isFollowing: result.isFollowing,
      followersCount: result.followersCount,
    };
  } catch (error: any) {
    logger.error("Failed to toggle tag follow", error, { tagId });
    return { success: false, error: "Something went wrong." };
  }
}

export async function checkIsFollowingTag(tagId: string): Promise<boolean> {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) return false;
    return await tagFollowRepository.isFollowing(session.user.id, tagId);
  } catch {
    return false;
  }
}
