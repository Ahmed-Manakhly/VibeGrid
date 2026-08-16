import { restrictTo } from "@/shared/kernel/guards";
import { createVibeTaxonomyUseCase } from "@/shared/infrastructure/di-container";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await restrictTo("ADMIN");

    const body = await req.json();
    const { key, label } = body;

    const vibe = await createVibeTaxonomyUseCase.execute({ key, label });

    return NextResponse.json(vibe, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
