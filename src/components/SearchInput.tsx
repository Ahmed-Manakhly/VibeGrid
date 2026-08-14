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
          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder-gray-400 backdrop-blur-sm transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
