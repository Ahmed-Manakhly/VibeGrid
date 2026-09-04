import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { getProfileUseCase, updateProfileUseCase } from "@/shared/infrastructure/di-container";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const profile = await getProfileUseCase.execute(session.user.username || session.user.id);
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { name, username, bio, location, website, image } = body;

    const result = await updateProfileUseCase.execute(session.user.id, {
      name,
      username,
      bio,
      location,
      website,
      image,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}
