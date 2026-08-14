import { getTrendingTagsUseCase } from "@/shared/infrastructure/di-container";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const trending = await getTrendingTagsUseCase.execute(limit);
    return NextResponse.json({ trending });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
