import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import {
  listCommunitiesUseCase,
  createCommunityUseCase,
  getCommunityBySlugUseCase,
  logger,
} from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getCurrentSession();
    const viewerId = session.isAuthenticated && session.user ? session.user.id : undefined;

    const tag = searchParams.get("tag") || undefined;
    const search = searchParams.get("search") || undefined;
    const cursor = searchParams.get("cursor") || undefined;
    const limit = searchParams.has("limit") ? Number(searchParams.get("limit")) : 20;

    let excludeCreatorIds: string[] | undefined = undefined;
    if (viewerId) {
      try {
        const { trustSafetyRepository } = await import("@/shared/infrastructure/di-container");
        excludeCreatorIds = await trustSafetyRepository.getBlockedUserIds(viewerId);
      } catch (e) {
        // Non-fatal
      }
    }

    const result = await listCommunitiesUseCase.execute({
      tag,
      search,
      cursor,
      limit,
      viewerId,
      excludeCreatorIds,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Failed to list communities via REST API", error);
    return NextResponse.json({ error: error.message || "Failed to list communities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, description, avatarUrl, bannerUrl, techTags, rules, isPrivate } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Community name is required" }, { status: 400 });
    }

    const targetSlug = slug || name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");

    try {
      const created = await createCommunityUseCase.execute({
        name: name.trim(),
        slug: targetSlug,
        description,
        avatarUrl,
        bannerUrl,
        techTags,
        rules,
        isPrivate,
        creatorId: session.user.id,
      });

      return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (createErr: any) {
      if (createErr.message?.includes("already exists")) {
        const existing = await getCommunityBySlugUseCase.execute({ slug: targetSlug });
        return NextResponse.json({ success: true, data: existing, note: "Already exists" }, { status: 200 });
      }
      throw createErr;
    }
  } catch (error: any) {
    logger.error("Failed to create community via REST API", error);
    return NextResponse.json({ error: error.message || "Failed to create community" }, { status: 500 });
  }
}

