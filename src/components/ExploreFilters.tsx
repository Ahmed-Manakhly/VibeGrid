"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function ExploreFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [vibes, setVibes] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/feed/filters")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (data.vibes) setVibes(data.vibes);
      })
      .catch(console.error);
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Categories</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("category", null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !currentCategory ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10 text-gray-300"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter("category", c.slug)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentCategory === c.slug ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10 text-gray-300"
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
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !currentVibe ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10 text-gray-300"
            }`}
          >
            Any
          </button>
          {vibes.map((v) => (
            <button
              key={v.id}
              onClick={() => setFilter("vibe", v.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                currentVibe === v.key ? "bg-primary text-white" : "bg-white/5 hover:bg-white/10 text-gray-300"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
