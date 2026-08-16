import { restrictTo } from "@/shared/kernel/guards";
import { createCategoryUseCase } from "@/shared/infrastructure/di-container";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await restrictTo("ADMIN");

    const body = await req.json();
    const { name, slug, emoji } = body;

    const category = await createCategoryUseCase.execute({ name, slug, emoji });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
