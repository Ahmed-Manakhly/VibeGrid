"use client";

import React, { useState, useTransition, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Users, Search, Flame, Compass, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CommunityCard } from "@/components/community/CommunityCard";
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";

const CURATED_TAGS = [
  "all",
  "frontend",
  "backend",
  "ai",
  "rust",
  "devops",
  "typescript",
  "systems",
  "oss",
];

interface CommunitiesDirectoryViewProps {
  initialCommunities: CommunityEntity[];
}

export function CommunitiesDirectoryView({ initialCommunities }: CommunitiesDirectoryViewProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

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
            (t) => t.toLowerCase().replace(/^#/, "") === selectedTag.toLowerCase()
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

      {/* Tag Filters Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CURATED_TAGS.map((tag) => {
          const isActive = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/50 text-muted-foreground border border-border/40 hover:bg-secondary hover:text-foreground"
              }`}
            >
              {tag === "all" ? "🔥 All Guilds" : `#${tag}`}
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

