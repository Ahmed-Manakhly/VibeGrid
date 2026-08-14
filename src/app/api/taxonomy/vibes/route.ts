import { restrictTo } from "@/shared/kernel/guards";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    await restrictTo("ADMIN");

    const body = await req.json();
    const { key, label } = body;

    const vibe = await prisma.vibe.create({
      data: { key, label },
    });

    return NextResponse.json(vibe, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
