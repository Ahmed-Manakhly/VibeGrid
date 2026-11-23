import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { getCommunityBySlugUseCase, joinCommunityUseCase } from "@/shared/infrastructure/di-container";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: "Community slug is required" }, { status: 400 });
    }

    const community = await getCommunityBySlugUseCase.execute({
      slug,
      viewerId: session.user.id,
    });

    if (!community) {
      return NextResponse.json({ success: false, error: "Community not found" }, { status: 404 });
    }

    const member = await joinCommunityUseCase.execute({
      communityId: community.id,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, member, communityId: community.id });
  } catch (error: any) {
    if (error.message?.includes("already a member")) {
      return NextResponse.json({ success: true, message: "Already a member" });
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to join community" },
      { status: 500 }
    );
  }
}

