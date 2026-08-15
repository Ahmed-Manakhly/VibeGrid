"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    } else {
      router.push("/explore");
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md mx-auto mb-6">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search vibes, tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-card border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder-muted-foreground backdrop-blur-sm transition-all shadow-sm"
        />
        <button
          type="submit"
          className="absolute right-2 px-4 py-1.5 btn-gradient rounded-full text-sm font-medium"
        >
          Search
        </button>
      </div>
    </form>
  );
}
