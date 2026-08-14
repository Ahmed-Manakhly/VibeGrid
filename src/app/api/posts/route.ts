import { generateFeedUseCase } from "@/shared/infrastructure/di-container";
import { NextResponse } from "next/server";
import { FeedQueryParams } from "@/shared/kernel/FeedQueryParams";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: FeedQueryParams = {
      search: searchParams.get("q") || undefined,
      tag: searchParams.get("tag") || undefined,
      category: searchParams.get("category") || undefined,
      vibe: searchParams.get("vibe") || undefined,
      cursor: searchParams.get("cursor") || undefined,
      limit: parseInt(searchParams.get("limit") || "12", 10),
    };

    const result = await generateFeedUseCase.execute(params);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
