"use server";

import { getCurrentSession } from "@/lib/auth/server";
import {
  listCommunitiesUseCase,
  getCommunityBySlugUseCase,
  createCommunityUseCase,
  joinCommunityUseCase,
  leaveCommunityUseCase,
  getCommunityFeedUseCase,
  getCommunityMembersUseCase,
  deleteCommunityUseCase,
  getUserCommunitiesUseCase,
  updateCommunityUseCase,
  updateMemberRoleUseCase,
  removeMemberUseCase,
  logger,
} from "@/shared/infrastructure/di-container";
import { CommunityRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function listCommunitiesAction(params: {
  tag?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}) {
  try {
    const session = await getCurrentSession();
    const viewerId = session.isAuthenticated && session.user ? session.user.id : undefined;

    let excludeCreatorIds: string[] | undefined = undefined;
    if (viewerId) {
      const { trustSafetyRepository } = await import("@/shared/infrastructure/di-container");
      excludeCreatorIds = await trustSafetyRepository.getBlockedUserIds(viewerId);
    }

    const result = await listCommunitiesUseCase.execute({
      ...params,
      viewerId,
      excludeCreatorIds,
    });

    return { success: true, data: result };
  } catch (error: any) {
    logger.error("Failed to list communities", error);
    return { success: false, error: error.message || "Failed to list communities." };
  }
}

export async function getCommunityBySlugAction(slug: string) {
  try {
    const session = await getCurrentSession();
    const viewerId = session.isAuthenticated && session.user ? session.user.id : undefined;

    const community = await getCommunityBySlugUseCase.execute({
      slug,
      viewerId,
    });

    if (!community) {
      return { success: false, error: "Community not found" };
    }

    return { success: true, data: community };
  } catch (error: any) {
    logger.error("Failed to fetch community", error, { slug });
    return { success: false, error: error.message || "Failed to fetch community." };
  }
}

export async function createCommunityAction(formData: {
  name: string;
  slug?: string;
  description?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  techTags?: string[];
  rules?: string[];
}) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized. Please log in to create a community." };
    }

    const created = await createCommunityUseCase.execute({
      ...formData,
      creatorId: session.user.id,
    });

    revalidatePath("/communities");
    return { success: true, data: created };
  } catch (error: any) {
    logger.error("Failed to create community", error, { formData });
    return { success: false, error: error.message || "Failed to create community." };
  }
}

export async function joinCommunityAction(communityId: string, slug?: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized. Please log in to join." };
    }

    const membership = await joinCommunityUseCase.execute({
      communityId,
      userId: session.user.id,
    });

    revalidatePath("/communities");
    if (slug) {
      revalidatePath(`/communities/${slug}`);
    }

    return { success: true, data: membership };
  } catch (error: any) {
    logger.error("Failed to join community", error, { communityId });
    return { success: false, error: error.message || "Failed to join community." };
  }
}

export async function leaveCommunityAction(communityId: string, slug?: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }

    await leaveCommunityUseCase.execute({
      communityId,
      userId: session.user.id,
    });

    revalidatePath("/communities");
    if (slug) {
      revalidatePath(`/communities/${slug}`);
    }

    return { success: true };
  } catch (error: any) {
    logger.error("Failed to leave community", error, { communityId });
    return { success: false, error: error.message || "Failed to leave community." };
  }
}

export async function getCommunityFeedAction(communityId: string, params: { limit?: number; cursor?: string } = {}) {
  try {
    const session = await getCurrentSession();
    const viewerId = session.isAuthenticated && session.user ? session.user.id : undefined;

    const result = await getCommunityFeedUseCase.execute({
      communityId,
      limit: params.limit,
      cursor: params.cursor,
      viewerId,
    });

    return { success: true, data: result };
  } catch (error: any) {
    logger.error("Failed to fetch community feed", error, { communityId });
    return { success: false, error: error.message || "Failed to fetch community feed." };
  }
}

export async function getCommunityMembersAction(communityId: string, limit: number = 20) {
  try {
    const members = await getCommunityMembersUseCase.execute({
      communityId,
      limit,
    });

    return { success: true, data: members };
  } catch (error: any) {
    logger.error("Failed to fetch community members", error, { communityId });
    return { success: false, error: error.message || "Failed to fetch community members." };
  }
}

export async function deleteCommunityAction(communityId: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await deleteCommunityUseCase.execute({
      communityId,
      userId: session.user.id,
    });

    revalidatePath("/communities");
    return { success: true };
  } catch (error: any) {
    logger.error("Failed to delete community", error, { communityId });
    return { success: false, error: error.message || "Failed to delete community." };
  }
}

export async function getUserCommunitiesAction(userId: string) {
  try {
    const communities = await getUserCommunitiesUseCase.execute(userId);
    return { success: true, data: communities };
  } catch (error: any) {
    logger.error("Failed to fetch user communities", error, { userId });
    return { success: false, error: error.message || "Failed to fetch user communities." };
  }
}

export async function updateCommunityAction(input: {
  communityId: string;
  name?: string;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  techTags?: string[];
  rules?: string[];
  isPrivate?: boolean;
}) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const updated = await updateCommunityUseCase.execute({
      ...input,
      userId: session.user.id,
    });

    revalidatePath(`/communities/${updated.slug}`);
    revalidatePath("/communities");
    return { success: true, data: updated };
  } catch (error: any) {
    logger.error("Failed to update community", error, { communityId: input.communityId });
    return { success: false, error: error.message || "Failed to update guild settings." };
  }
}

export async function updateMemberRoleAction(input: {
  communityId: string;
  targetUserId: string;
  newRole: CommunityRole;
  communitySlug?: string;
}) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await updateMemberRoleUseCase.execute({
      communityId: input.communityId,
      actorUserId: session.user.id,
      targetUserId: input.targetUserId,
      newRole: input.newRole,
    });

    if (input.communitySlug) {
      revalidatePath(`/communities/${input.communitySlug}`);
    }
    return { success: true };
  } catch (error: any) {
    logger.error("Failed to update member role", error, input);
    return { success: false, error: error.message || "Failed to update member role." };
  }
}

export async function removeMemberAction(input: {
  communityId: string;
  targetUserId: string;
  communitySlug?: string;
}) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    await removeMemberUseCase.execute({
      communityId: input.communityId,
      actorUserId: session.user.id,
      targetUserId: input.targetUserId,
    });

    if (input.communitySlug) {
      revalidatePath(`/communities/${input.communitySlug}`);
    }
    revalidatePath("/communities");
    return { success: true };
  } catch (error: any) {
    logger.error("Failed to remove member", error, input);
    return { success: false, error: error.message || "Failed to remove member." };
  }
}
