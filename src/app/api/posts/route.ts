import { generateFeedUseCase, createVibeUseCase, logger } from "@/shared/infrastructure/di-container";
import { NextResponse } from "next/server";
import { ExplorePostsCriteria } from "@/modules/vibe/domain/ExplorePostsCriteria";
import { getCurrentSession } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: ExplorePostsCriteria = {
      cursor: searchParams.get("cursor") || undefined,
      tag: searchParams.get("tag") || undefined,
      category: searchParams.get("category") || undefined,
      vibe: searchParams.get("vibe") || undefined,
      search: searchParams.get("search") || undefined,
      bookmarkedByUserId: searchParams.get("bookmarkedByUserId") || undefined,
      limit: searchParams.has("limit") ? Number(searchParams.get("limit")) : undefined,
    };

    const result = await generateFeedUseCase.execute(params);
    
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error("Error generating feed", error, { path: "/api/posts" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { content, mediaUrl, imageUrl, image, mediaType, tags, categoryId, vibeId } = body;

    const targetMediaUrl = mediaUrl || imageUrl || image;

    if (!content?.trim() && !targetMediaUrl) {
      return NextResponse.json({ error: "Post content or media required" }, { status: 400 });
    }

    const parsedMediaType = mediaType ? (String(mediaType).toUpperCase() as any) : undefined;

    const result = await createVibeUseCase.execute(
      content || "",
      targetMediaUrl || undefined,
      parsedMediaType,
      session.user.id,
      tags,
      undefined,
      categoryId,
      vibeId
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to create post" }, { status: 400 });
    }

    return NextResponse.json({ success: true, post: result.value }, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating vibe post", error, { path: "/api/posts" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
