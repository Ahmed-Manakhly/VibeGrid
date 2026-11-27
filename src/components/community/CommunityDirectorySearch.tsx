"use client";

import React, { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog";
import { CommunityCard } from "@/components/community/CommunityCard";
import { Compass } from "lucide-react";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";

interface CategoryTaxonomy {
  id: string;
  name: string;
  slug: string;
  emoji?: string | null;
}

interface CommunityDirectorySearchProps {
  categories?: CategoryTaxonomy[];
  initialCommunities: CommunityEntity[];
  children?: React.ReactNode;
}

export function CommunityDirectorySearch({
  categories = [],
  initialCommunities,
  children,
}: CommunityDirectorySearchProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  const filterPills = useMemo(() => {
    const pills = [{ key: "all", label: "🔥 All Guilds" }];
    const addedKeys = new Set<string>(["all"]);

    initialCommunities.forEach((c) => {
      c.techTags?.forEach((t) => {
        const rawTag = t.trim().toLowerCase().replace(/^#/, "");
        if (rawTag && !addedKeys.has(rawTag)) {
          addedKeys.add(rawTag);
          pills.push({ key: rawTag, label: `#${rawTag}` });
        }
      });
    });

    if (categories && categories.length > 0) {
      const activeCategorySlugs = new Set<string>();
      initialCommunities.forEach((c) => {
        c.techTags?.forEach((t) => {
          activeCategorySlugs.add(t.trim().toLowerCase().replace(/^#/, ""));
        });
      });

      categories.forEach((cat) => {
        const catKey = cat.slug.toLowerCase();
        if (activeCategorySlugs.has(catKey) && !addedKeys.has(catKey)) {
          addedKeys.add(catKey);
          pills.push({
            key: catKey,
            label: `${cat.emoji ? cat.emoji + " " : ""}${cat.name}`,
          });
        }
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

  const isFiltering = search.trim() !== "" || selectedTag !== "all";

  return (
    <div className="w-full space-y-6">
      {/* Interactive Control Bar Micro-Leaf */}
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
          <CreateCommunityDialog categories={categories} />
        </div>
      </div>

      {/* Dynamic Filter Pills Carousel */}
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

      {/* Grid Display: When filtering, display interactive client-filtered results; otherwise render server children */}
      {isFiltering ? (
        filteredCommunities.length > 0 ? (
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
              Try adjusting your search keywords or selecting a different tag filter.
            </p>
          </div>
        )
      ) : (
        children
      )}
    </div>
  );
}
