import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { getUserInterestsUseCase, setUserInterestsUseCase } from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

// Get the authenticated user's interests
export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const interests = await getUserInterestsUseCase.execute(session.user.id);
    return NextResponse.json({ success: true, interests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch interests" }, { status: 500 });
  }
}

// Replace the user's interests
export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const body = await request.json();
    const { categoryIds } = body;
    if (!Array.isArray(categoryIds)) {
      return NextResponse.json({ error: "categoryIds must be an array" }, { status: 400 });
    }
    await setUserInterestsUseCase.execute(session.user.id, categoryIds);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to set interests" }, { status: 500 });
  }
}

export const PATCH = PUT;
