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
  logger,
} from "@/shared/infrastructure/di-container";
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

    const result = await listCommunitiesUseCase.execute({
      ...params,
      viewerId,
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
