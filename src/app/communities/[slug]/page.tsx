import { notFound } from "next/navigation";
import { getCommunityBySlugAction, getCommunityFeedAction, getCommunityMembersAction } from "@/actions/community.action";
import { getDbUserId } from "@/actions/user.action";
import { CommunitySpaceView } from "@/components/community/CommunitySpaceView";

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

  // Parallel fetch: Scoped community feed + Members roster
  const [feedRes, membersRes] = await Promise.all([
    getCommunityFeedAction(community.id, { limit: 20 }),
    getCommunityMembersAction(community.id, 50),
  ]);

  const initialPosts = feedRes.success && feedRes.data ? feedRes.data.posts : [];
  const initialMembers = membersRes.success && membersRes.data ? membersRes.data : [];

  return (
    <CommunitySpaceView
      community={community}
      initialPosts={initialPosts}
      initialMembers={initialMembers}
      dbUserId={dbUserId}
    />
  );
}
