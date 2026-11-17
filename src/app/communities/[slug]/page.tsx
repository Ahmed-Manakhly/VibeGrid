import { notFound } from "next/navigation";
import { getCommunityBySlugAction, getCommunityFeedAction, getCommunityMembersAction } from "@/actions/community.action";
import { getDbUserId } from "@/actions/user.action";
import { getTaxonomyUseCase } from "@/shared/infrastructure/di-container";
import { CommunitySpaceView } from "@/components/community/CommunitySpaceView";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { CommunityMembersSidebar } from "@/components/community/CommunityMembersSidebar";
import { MyCommunitiesSidebar } from "@/components/community/MyCommunitiesSidebar";
import { TrendingSidebar } from "@/components/TrendingSidebar";

interface CommunityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CommunityPageProps) {
  const { slug } = await params;
  const result = await getCommunityBySlugAction(slug);
  if (!result.success || !result.data) {
    return {
      title: "Community Not Found | VibeGrid",
    };
  }

  return {
    title: `${result.data.name} | VibeGrid Community`,
    description: result.data.description || `Developer hub for ${result.data.name} on VibeGrid`,
  };
}

export default async function CommunitySlugPage({ params }: CommunityPageProps) {
  const { slug } = await params;
  const dbUserId = await getDbUserId();

  const communityRes = await getCommunityBySlugAction(slug);
  if (!communityRes.success || !communityRes.data) {
    notFound();
  }

  const community = communityRes.data;

  // If the viewer has blocked the community creator or the creator blocked the viewer, deny access
  if (dbUserId && community.creatorId && dbUserId !== community.creatorId) {
    const { trustSafetyRepository } = await import("@/shared/infrastructure/di-container");
    const isBlocked = await trustSafetyRepository.isBlocked(dbUserId, community.creatorId);
    if (isBlocked) {
      const { redirect } = await import("next/navigation");
      redirect("/?blocked=true");
    }
  }

  // Parallel fetch: Scoped community feed + Members roster + Taxonomy
  const [feedRes, membersRes, taxonomy] = await Promise.all([
    getCommunityFeedAction(community.id, { limit: 20 }),
    getCommunityMembersAction(community.id, 50),
    getTaxonomyUseCase.execute().catch(() => ({ categories: [], vibes: [] })),
  ]);

  const initialPosts = feedRes.success && feedRes.data ? feedRes.data.posts : [];
  const initialMembers = membersRes.success && membersRes.data ? membersRes.data : [];
  const categories = taxonomy?.categories || [];

  return (
    <MobileTabsLayout
      feed={
        <CommunitySpaceView
          community={community}
          initialPosts={initialPosts}
          initialMembers={initialMembers}
          dbUserId={dbUserId}
          categories={categories}
        />
      }
      discovery={
        <>
          <CommunityMembersSidebar
            communityName={community.name}
            members={initialMembers}
            currentUserId={dbUserId}
          />
          <MyCommunitiesSidebar userId={dbUserId} />
          <TrendingSidebar />
        </>
      }
    />
  );
}
