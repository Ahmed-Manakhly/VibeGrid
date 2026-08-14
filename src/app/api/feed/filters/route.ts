import { getTaxonomyUseCase } from "@/shared/infrastructure/di-container";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await getTaxonomyUseCase.execute();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
