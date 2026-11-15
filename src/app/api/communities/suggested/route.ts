import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/server";
import { getUserInterestsUseCase, listCommunitiesUseCase } from "@/shared/infrastructure/di-container";

export async function GET() {
  try {
    const session = await getCurrentSession();
    const viewerId = session.isAuthenticated && session.user ? session.user.id : undefined;

    // 1. Fetch user tech interests if logged in
    let userInterests: string[] = [];
    if (viewerId) {
      try {
        const interests = await getUserInterestsUseCase.execute(viewerId);
        userInterests = interests.map((cat: any) => cat.slug || cat.name.toLowerCase());
      } catch {
        // fallback empty
      }
    }

    // 2. Fetch communities
    const { items } = await listCommunitiesUseCase.execute({
      limit: 15,
      viewerId,
    });

    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, community: null });
    }

    // 3. Prefer communities the user has not yet joined
    const unjoined = items.filter((c: any) => !c.isMember);
    const candidateList = unjoined.length > 0 ? unjoined : items;

    // 4. Rank by matching user interest tags
    const scored = candidateList.map((c: any) => {
      let matchCount = 0;
      let matchedTag: string | null = null;
      if (Array.isArray(c.techTags) && userInterests.length > 0) {
        for (const tag of c.techTags) {
          const cleanTag = tag.toLowerCase().replace(/^#/, "");
          if (userInterests.some((interest) => cleanTag.includes(interest) || interest.includes(cleanTag))) {
            matchCount++;
            if (!matchedTag) matchedTag = tag;
          }
        }
      }
      return {
        ...c,
        matchCount,
        matchedTag,
      };
    });

    // Sort by matchCount DESC, then member count DESC
    scored.sort((a: any, b: any) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      return (b._count?.members || 0) - (a._count?.members || 0);
    });

    const suggested = scored[0] || null;

    return NextResponse.json({
      success: true,
      community: suggested,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, community: null }, { status: 500 });
  }
}

