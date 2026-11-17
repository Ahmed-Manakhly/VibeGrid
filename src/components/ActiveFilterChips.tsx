"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { X, Filter, Tag, Layers, Flame, Search } from "lucide-react";
import { useEffect, useState } from "react";

export function ActiveFilterChips() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; emoji: string | null }[]>([]);
  const [vibes, setVibes] = useState<{ id: string; label: string; key: string }[]>([]);

  useEffect(() => {
    fetch("/api/feed/filters")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (data.vibes) setVibes(data.vibes);
      })
      .catch(console.error);
  }, []);

  const currentCategory = searchParams.get("category");
  const currentTag = searchParams.get("tag");
  const currentVibe = searchParams.get("vibe");
  const currentQuery = searchParams.get("q");

  const hasAnyFilter = Boolean(currentCategory || currentTag || currentVibe || currentQuery);

  if (!hasAnyFilter) return null;

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete("cursor");
    const newQuery = params.toString();
    router.push(newQuery ? `${pathname}?${newQuery}` : pathname);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("tag");
    params.delete("vibe");
    params.delete("q");
    params.delete("cursor");
    const newQuery = params.toString();
    router.push(newQuery ? `${pathname}?${newQuery}` : pathname);
  };

  const matchedCategory = categories.find((c) => c.slug === currentCategory);
  const matchedVibe = vibes.find((v) => v.key === currentVibe);

  return (
    <div className="w-full rounded-2xl border border-primary/25 bg-card/70 backdrop-blur-md p-3 sm:p-4 mb-4 shadow-sm animate-in fade-in-50 duration-200">
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-border/40">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          <Filter className="size-3.5" />
          <span>Active Filters</span>
        </div>
        <button
          onClick={clearAllFilters}
          className="text-[11px] font-mono text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Category Chip */}
        {currentCategory && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/30 text-xs text-foreground font-medium shadow-sm">
            <Layers className="size-3 text-primary" />
            <span className="text-muted-foreground font-mono text-[10px] uppercase">Category:</span>
            <span>
              {matchedCategory?.emoji} {matchedCategory?.name || currentCategory}
            </span>
            <button
              onClick={() => removeFilter("category")}
              className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 text-muted-foreground hover:text-foreground transition-colors"
              title="Remove category filter"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Tag Chip */}
        {currentTag && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-foreground font-medium shadow-sm">
            <Tag className="size-3 text-emerald-500" />
            <span className="text-muted-foreground font-mono text-[10px] uppercase">Tag:</span>
            <span>#{currentTag}</span>
            <button
              onClick={() => removeFilter("tag")}
              className="ml-0.5 p-0.5 rounded-full hover:bg-emerald-500/20 text-muted-foreground hover:text-foreground transition-colors"
              title="Remove tag filter"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Vibe Chip */}
        {currentVibe && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-foreground font-medium shadow-sm">
            <Flame className="size-3 text-amber-500" />
            <span className="text-muted-foreground font-mono text-[10px] uppercase">Vibe:</span>
            <span>{matchedVibe?.label || currentVibe}</span>
            <button
              onClick={() => removeFilter("vibe")}
              className="ml-0.5 p-0.5 rounded-full hover:bg-amber-500/20 text-muted-foreground hover:text-foreground transition-colors"
              title="Remove vibe filter"
            >
              <X className="size-3" />
            </button>
          </div>
        )}

        {/* Search Query Chip */}
        {currentQuery && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-secondary/80 border border-border/60 text-xs text-foreground font-medium shadow-sm">
            <Search className="size-3 text-muted-foreground" />
            <span className="text-muted-foreground font-mono text-[10px] uppercase">Search:</span>
            <span className="max-w-[150px] truncate">&quot;{currentQuery}&quot;</span>
            <button
              onClick={() => removeFilter("q")}
              className="ml-0.5 p-0.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Remove search query"
            >
              <X className="size-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

