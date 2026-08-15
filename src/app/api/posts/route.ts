import { generateFeedUseCase } from "@/shared/infrastructure/di-container";
import { NextResponse } from "next/server";
import { ExplorePostsCriteria } from "@/modules/vibe/domain/ExplorePostsCriteria";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: ExplorePostsCriteria = {
      cursor: searchParams.get("cursor") || undefined,
      tag: searchParams.get("tag") || undefined,
      category: searchParams.get("category") || undefined,
      vibe: searchParams.get("vibe") || undefined,
      search: searchParams.get("search") || undefined,
      limit: searchParams.has("limit") ? Number(searchParams.get("limit")) : undefined,
    };

    const result = await generateFeedUseCase.execute(params);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
