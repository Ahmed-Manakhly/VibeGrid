import { listCommunitiesAction } from "@/actions/community.action";
import { getTaxonomyUseCase } from "@/shared/infrastructure/di-container";
import { getDbUserId } from "@/actions/user.action";
import { CommunitiesDirectoryView } from "@/components/community/CommunitiesDirectoryView";
import { MobileTabsLayout } from "@/components/MobileTabsLayout";
import { MyCommunitiesSidebar } from "@/components/community/MyCommunitiesSidebar";
import { TrendingSidebar } from "@/components/TrendingSidebar";
import { PageHeader } from "@/components/PageHeader";
import { Users } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Developer Communities & Guilds",
  description: "Discover and join developer communities, tech guilds, and open-source groups on VibeGrid.",
  url: "/communities",
});

export default async function CommunitiesPage() {
  const [commResult, taxonomy, dbUserId] = await Promise.all([
    listCommunitiesAction({ limit: 50 }),
    getTaxonomyUseCase.execute().catch(() => ({ categories: [], vibes: [] })),
    getDbUserId(),
  ]);

  const initialCommunities = commResult.success && commResult.data ? commResult.data.items : [];
  const categories = taxonomy?.categories || [];

  return (
    <>
      <div className="mb-6">
        <PageHeader
          eyebrow="BUILDER NETWORKS"
          title="Developer Communities"
          subtitle="Discover tech circles, engineering guilds, and framework ecosystems built for high-signal code sharing."
          icon={Users}
          className="mb-4"
        />
      </div>

      <MobileTabsLayout
        feed={
          <CommunitiesDirectoryView 
            initialCommunities={initialCommunities} 
            categories={categories}
          />
        }
        discovery={
          <>
            <MyCommunitiesSidebar userId={dbUserId} />
            <TrendingSidebar />
          </>
        }
      />
    </>
  );
}
