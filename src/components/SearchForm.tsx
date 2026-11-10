"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent } from "react";

interface SearchFormProps {
  variant?: "inline" | "hero" | "mobile";
  className?: string;
  placeholder?: string;
}

export function SearchForm({
  variant = "inline",
  className = "",
  placeholder = "Search the grid...",
}: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(variant === "hero" ? (searchParams?.get("q") || "") : "");

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
      if (variant !== "hero") setQuery("");
    } else if (variant === "hero") {
      router.push("/explore");
    }
  };

  if (variant === "hero") {
    return (
      <form onSubmit={handleSearch} className={`relative w-full mb-6 ${className}`}>
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3.5 w-5 h-5 text-muted-foreground hover:text-accent transition-colors cursor-pointer" />
          <input
            type="text"
            placeholder={placeholder || "Search vibes, tags..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground placeholder-muted-foreground backdrop-blur-sm transition-all shadow-sm"
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

  if (variant === "mobile") {
    return (
      <form onSubmit={handleSearch} className={`nav-glass lg:hidden px-4 sm:px-6 py-2 border-t-0 shadow-none rounded-none !bg-background/95 ${className}`}>
        <div className="relative w-full">
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1">
            <Search className="size-4 text-muted-foreground cursor-pointer hover:text-accent transition-colors" />
          </button>
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-border focus:ring-1 focus:ring-border" 
            placeholder={placeholder} 
            aria-label={placeholder} 
          />
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className={`relative w-full max-w-sm hidden lg:block ${className}`}>
      <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1">
        <Search className="size-4 text-muted-foreground cursor-pointer hover:text-accent transition-colors" />
      </button>
      <input 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-10 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-border focus:ring-1 focus:ring-accent/50" 
        placeholder={placeholder} 
        aria-label={placeholder} 
      />
    </form>
  );
}

// Re-exports for backwards compatibility
export { SearchForm as SearchInput };
export { SearchForm as NavSearch };
export function MobileNavSearch() {
  return <SearchForm variant="mobile" />;
}
