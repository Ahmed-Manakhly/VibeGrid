import { NextResponse } from "next/server";
import { getTrendingTagsUseCase } from "@/shared/infrastructure/di-container";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const trendingTags = await getTrendingTagsUseCase.execute(limit);
    
    // Map to the expected API shape: just the tags themselves
    const tags = trendingTags.map(t => ({
      ...t.tag,
      _count: { posts: t.recentCount }
    }));

    return NextResponse.json({ tags });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
