import { NextResponse } from "next/server";
import { searchUsersUseCase } from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const limit = searchParams.has("limit") ? Number(searchParams.get("limit")) : 8;

    if (!query.trim()) {
      return NextResponse.json({ success: true, users: [] });
    }

    const users = await searchUsersUseCase.execute(query.trim(), limit);

    return NextResponse.json({
      success: true,
      query,
      users,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "User search failed" }, { status: 500 });
  }
}
