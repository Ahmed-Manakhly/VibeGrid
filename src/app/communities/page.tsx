import { listCommunitiesAction } from "@/actions/community.action";
import { CommunitiesDirectoryView } from "@/components/community/CommunitiesDirectoryView";

export const metadata = {
  title: "Communities | VibeGrid",
  description: "Developer hubs, tech circles, and builder ecosystems on VibeGrid",
};

export default async function CommunitiesPage() {
  const result = await listCommunitiesAction({ limit: 50 });
  const initialCommunities = result.success && result.data ? result.data.items : [];

  return <CommunitiesDirectoryView initialCommunities={initialCommunities} />;
}
