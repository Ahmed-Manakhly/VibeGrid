import { NextResponse } from "next/server";
import { getSuggestedUsersUseCase } from "@/shared/infrastructure/di-container";
import { getDbUserId } from "@/actions/user.action";

export async function GET() {
  try {
    const userId = await getDbUserId();
    const creators = await getSuggestedUsersUseCase.execute(userId || undefined);
    return NextResponse.json({ creators });
  } catch (err) {
    return NextResponse.json({ creators: [] }, { status: 500 });
  }
}
