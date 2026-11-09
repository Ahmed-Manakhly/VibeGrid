"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";

export function NavSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-sm hidden lg:block">
      <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1">
        <Search className="size-4 text-muted-foreground cursor-pointer hover:text-accent transition-colors" />
      </button>
      <input 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-border focus:ring-1 focus:ring-accent/50" 
        placeholder="Search the grid..." 
        aria-label="Search the grid" 
      />
    </form>
  );
}

export function MobileNavSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSearch} className="nav-glass lg:hidden px-4 sm:px-6 pb-3 pt-1 border-t-0 shadow-none rounded-none !bg-background/95">
      <div className="relative w-full">
        <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1">
          <Search className="size-4 text-muted-foreground cursor-pointer hover:text-accent transition-colors" />
        </button>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-border focus:ring-1 focus:ring-border" 
          placeholder="Search the grid..." 
          aria-label="Search the grid" 
        />
      </div>
    </form>
  );
}
