import React from "react";
import { CommunityCard } from "@/components/community/CommunityCard";
import { CommunityDirectorySearch } from "@/components/community/CommunityDirectorySearch";
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog";
import { Compass } from "lucide-react";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";

interface CategoryTaxonomy {
  id: string;
  name: string;
  slug: string;
  emoji?: string | null;
}

interface CommunitiesDirectoryViewProps {
  initialCommunities: CommunityEntity[];
  categories?: CategoryTaxonomy[];
}

export function CommunitiesDirectoryView({
  initialCommunities,
  categories = [],
}: CommunitiesDirectoryViewProps) {
  return (
    <div className="w-full py-0 px-0">
      {/* Client Micro-Leaf controls Search & Filters, rendering initial server grid when idle, or filtered grid when searching */}
      <CommunityDirectorySearch
        categories={categories}
        initialCommunities={initialCommunities}
      >
        {initialCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initialCommunities.map((community) => (
              <CommunityCard key={community.id} community={community} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card/40 rounded-2xl border border-border/40 p-8 shadow-sm">
            <div className="flex justify-center mb-4 text-muted-foreground">
              <div className="p-4 rounded-full bg-secondary/50 border border-border/40">
                <Compass className="size-10 opacity-70" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No Communities Found</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-5 leading-relaxed">
              No developer communities have been launched yet. Be the first to build a guild!
            </p>
            <CreateCommunityDialog />
          </div>
        )}
      </CommunityDirectorySearch>
    </div>
  );
}
