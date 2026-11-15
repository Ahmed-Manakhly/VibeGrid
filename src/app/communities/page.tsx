import { listCommunitiesAction } from "@/actions/community.action";
import { getTaxonomyUseCase } from "@/shared/infrastructure/di-container";
import { CommunitiesDirectoryView } from "@/components/community/CommunitiesDirectoryView";

export const metadata = {
  title: "Communities | VibeGrid",
  description: "Developer hubs, tech circles, and builder ecosystems on VibeGrid",
};

export default async function CommunitiesPage() {
  const [commResult, taxonomy] = await Promise.all([
    listCommunitiesAction({ limit: 50 }),
    getTaxonomyUseCase.execute().catch(() => ({ categories: [], vibes: [] })),
  ]);

  const initialCommunities = commResult.success && commResult.data ? commResult.data.items : [];
  const categories = taxonomy?.categories || [];

  return (
    <CommunitiesDirectoryView 
      initialCommunities={initialCommunities} 
      categories={categories}
    />
  );
}
