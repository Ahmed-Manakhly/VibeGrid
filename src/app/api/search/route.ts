import { NextResponse } from "next/server";
import { generateFeedUseCase } from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("search") || "";
    const tag = searchParams.get("tag") || undefined;
    const category = searchParams.get("category") || undefined;
    const vibe = searchParams.get("vibe") || undefined;
    const limit = searchParams.has("limit") ? Number(searchParams.get("limit")) : 20;

    const result = await generateFeedUseCase.execute({
      search: query,
      tag,
      category,
      vibe,
      limit,
    });

    return NextResponse.json({
      success: true,
      query,
      posts: result.data,
      nextCursor: result.nextCursor,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  }
}
