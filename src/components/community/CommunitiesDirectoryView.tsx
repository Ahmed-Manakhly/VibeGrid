"use client";

import React, { useState, useTransition, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Users, Search, Flame, Compass, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CommunityCard } from "@/components/community/CommunityCard";
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog";
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
  categories = [] 
}: CommunitiesDirectoryViewProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  // Dynamic filter tags derived from database categories, falling back to discovered tags
  const filterPills = useMemo(() => {
    const pills = [{ key: "all", label: "🔥 All Guilds" }];
    
    if (categories && categories.length > 0) {
      categories.forEach((cat) => {
        pills.push({
          key: cat.slug.toLowerCase(),
          label: `${cat.emoji ? cat.emoji + " " : "#"}${cat.name}`,
        });
      });
    } else {
      // Fallback to tags present on communities
      const tagSet = new Set<string>();
      initialCommunities.forEach((c) => {
        c.techTags?.forEach((t) => tagSet.add(t.toLowerCase().replace(/^#/, "")));
      });
      tagSet.forEach((t) => {
        pills.push({ key: t, label: `#${t}` });
      });
    }

    return pills;
  }, [categories, initialCommunities]);

  const filteredCommunities = useMemo(() => {
    return initialCommunities.filter((c) => {
      const matchesSearch =
        search.trim() === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
        (c.techTags && c.techTags.some((t) => t.toLowerCase().includes(search.toLowerCase())));

      const matchesTag =
        selectedTag === "all" ||
        (c.techTags &&
          c.techTags.some(
            (t) =>
              t.toLowerCase().replace(/^#/, "") === selectedTag.toLowerCase() ||
              t.toLowerCase().replace(/[^a-z0-9]/g, "") === selectedTag.toLowerCase().replace(/[^a-z0-9]/g, "")
          ));

      return matchesSearch && matchesTag;
    });
  }, [initialCommunities, search, selectedTag]);

  return (
    <div className="w-full max-w-4xl py-2 px-0 space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="BUILDER NETWORKS"
        title="Developer Communities"
        subtitle="Discover tech circles, engineering guilds, and framework ecosystems built for high-signal code sharing."
        icon={Users}
      />

      {/* Control Bar: Search & Create Guild Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card/40 border border-border/40 p-3 rounded-xl backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities by name, description, or stack..."
            className="pl-9 h-9 bg-secondary/30 border-border/50 text-sm focus-visible:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <CreateCommunityDialog />
        </div>
      </div>

      {/* Dynamic Category/Tag Filters Carousel (Layout-Stable) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none min-h-[38px]">
        {filterPills.map((pill) => {
          const isActive = selectedTag === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setSelectedTag(pill.key)}
              className={`shrink-0 h-8 px-3.5 rounded-full text-xs font-mono font-medium transition-colors border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground hover:border-border"
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Communities Grid */}
      {filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCommunities.map((community) => (
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
            {search || selectedTag !== "all"
              ? "Try adjusting your search keywords or selecting a different tag filter."
              : "No developer communities have been launched yet. Be the first to build a guild!"}
          </p>
          <CreateCommunityDialog />
        </div>
      )}
    </div>
  );
}

