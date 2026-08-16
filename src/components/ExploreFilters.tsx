"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ExploreFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [vibes, setVibes] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [isTagsLoading, setIsTagsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/feed/filters")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (data.vibes) setVibes(data.vibes);
      })
      .catch(console.error);

    fetch("/api/feed/tags?limit=30")
      .then((res) => res.json())
      .then((data) => {
        if (data.tags) setTags(data.tags);
      })
      .catch(console.error)
      .finally(() => setIsTagsLoading(false));
  }, []);

  const setFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Delete cursor when changing filters to start from top
    params.delete("cursor");
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentCategory = searchParams.get("category");
  const currentVibe = searchParams.get("vibe");
  const currentTag = searchParams.get("tag");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("category", null)}
            className={`topic-pill ${
              !currentCategory ? "topic-pill-active" : "bg-card"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter("category", c.slug)}
              className={`topic-pill ${
                currentCategory === c.slug ? "topic-pill-active" : "bg-card"
              }`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Vibes</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("vibe", null)}
            className={`topic-pill ${
              !currentVibe ? "topic-pill-active" : "bg-card"
            }`}
          >
            Any
          </button>
          {vibes.map((v) => (
            <button
              key={v.id}
              onClick={() => setFilter("vibe", v.key)}
              className={`topic-pill ${
                currentVibe === v.key ? "topic-pill-active" : "bg-card"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Tags</h3>
        {isTagsLoading ? (
          <p className="text-sm text-muted-foreground px-2">Loading...</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("tag", null)}
              className={`topic-pill ${
                !currentTag ? "topic-pill-active" : "bg-card"
              }`}
            >
              All
            </button>
            {currentTag && !tags.find(t => t.slug === currentTag) && (
              <button
                onClick={() => setFilter("tag", currentTag)}
                className="topic-pill topic-pill-active"
              >
                #{currentTag}
              </button>
            )}
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter("tag", t.slug)}
                className={`topic-pill ${
                  currentTag === t.slug ? "topic-pill-active" : "bg-card"
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
