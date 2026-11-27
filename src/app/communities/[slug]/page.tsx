import { notFound } from "next/navigation";
import { getCommunityBySlugAction, getCommunityFeedAction, getCommunityMembersAction } from "@/actions/community.action";
import { getDbUserId } from "@/actions/user.action";
import { getTaxonomyUseCase } from "@/shared/infrastructure/di-container";
import { CommunitySpaceView } from "@/components/community/CommunitySpaceView";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { CommunityMembersSidebar } from "@/components/community/CommunityMembersSidebar";
import { MyCommunitiesSidebar } from "@/components/community/MyCommunitiesSidebar";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import {
  generatePageMetadata,
  getRouteKeywords,
  getCommunityStructuredData,
  getBreadcrumbStructuredData,
} from "@/lib/seo";

interface CommunityPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: CommunityPageProps) {
  const { slug } = await params;
  const result = await getCommunityBySlugAction(slug);
  if (!result.success || !result.data) {
    return generatePageMetadata({
      title: "Community Not Found",
      noIndex: true,
    });
  }

  const community = result.data;
  return generatePageMetadata({
    title: `${community.name} Guild & Developer Hub`,
    description: community.description || `Developer hub and guild for ${community.name} on VibeGrid.`,
    image: community.bannerUrl || community.avatarUrl,
    url: `/communities/${slug}`,
    keywords: [
      ...getRouteKeywords("communities"),
      community.name,
      slug,
      ...((community as any).tags || []).map((t: any) => (typeof t === 'string' ? t : t.name || t.slug)).filter(Boolean),
    ],
  });
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

  const communityStructuredData = getCommunityStructuredData({
    name: community.name,
    slug: community.slug,
    description: community.description,
    avatarUrl: community.avatarUrl,
    bannerUrl: community.bannerUrl,
    memberCount: community._count?.members,
    createdAt: community.createdAt,
  });

  const breadcrumbsStructuredData = getBreadcrumbStructuredData([
    { name: "Home", url: "/" },
    { name: "Communities", url: "/communities" },
    { name: community.name, url: `/communities/${community.slug}` },
  ]);

  return (
    <>
      {communityStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(communityStructuredData) }}
        />
      )}
      {breadcrumbsStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsStructuredData) }}
        />
      )}
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
            {community.isMember && (
              <CommunityMembersSidebar
                communityName={community.name}
                members={initialMembers}
                currentUserId={dbUserId}
              />
            )}
            <MyCommunitiesSidebar userId={dbUserId} />
            <TrendingSidebar />
          </>
        }
      />
    </>
  );
}
