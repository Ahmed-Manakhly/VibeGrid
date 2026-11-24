"use client";

import { Search, User as UserIcon, X, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, FormEvent } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/UserAvatar";

interface SearchFormProps {
  variant?: "inline" | "hero" | "mobile";
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSearchSubmit?: () => void;
  onClose?: () => void;
}

interface UserSearchResult {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
}

export function SearchForm({
  variant = "inline",
  className = "",
  placeholder = "Search vibes, people...",
  autoFocus = false,
  onSearchSubmit,
  onClose,
}: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(variant === "hero" ? (searchParams?.get("q") || "") : "");
  const [matchingUsers, setMatchingUsers] = useState<UserSearchResult[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch quick user suggestions as user types
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setMatchingUsers([]);
      setIsLoadingUsers(false);
      return;
    }

    setIsLoadingUsers(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/users?q=${encodeURIComponent(trimmed)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.users)) {
            setMatchingUsers(data.users);
            setShowDropdown(true);
          }
        }
      } catch (err) {
        // Silent catch
      } finally {
        setIsLoadingUsers(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
      if (variant !== "hero") setQuery("");
      onSearchSubmit?.();
    } else if (variant === "hero") {
      router.push("/explore");
      onSearchSubmit?.();
    }
  };

  const clearQuery = () => {
    setQuery("");
    setMatchingUsers([]);
    setShowDropdown(false);
  };

  const renderDropdown = () => {
    if (!showDropdown || matchingUsers.length === 0) return null;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95">
        <div className="px-3.5 py-2 border-b border-border/40 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <UserIcon className="size-3 text-primary" />
            People & Developers
          </span>
          {isLoadingUsers && <Loader2 className="size-3 animate-spin text-primary" />}
        </div>
        <div className="p-1.5 flex flex-col gap-1 max-h-64 overflow-y-auto">
          {matchingUsers.map((user) => {
            const displayName = user.name || user.username;
            return (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                onClick={() => {
                  setShowDropdown(false);
                  onClose?.();
                }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/70 transition-colors group"
              >
                <UserAvatar src={user.image} name={displayName} className="size-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="w-full text-left px-3.5 py-2.5 text-xs text-primary font-medium border-t border-border/40 hover:bg-primary/10 transition-colors flex items-center justify-between"
        >
          <span>Search all results for &quot;{query}&quot;</span>
          <Search className="size-3" />
        </button>
      </div>
    );
  };

  if (variant === "hero") {
    return (
      <div ref={containerRef} className={`relative w-full mb-6 ${className}`}>
        <form onSubmit={handleSearch} className="relative flex items-center w-full">
          <Search className="absolute left-3.5 w-5 h-5 text-muted-foreground hover:text-accent transition-colors cursor-pointer" />
          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onFocus={() => matchingUsers.length > 0 && setShowDropdown(true)}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-28 py-3 bg-card border border-border/50 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50 text-foreground placeholder-muted-foreground backdrop-blur-sm transition-all shadow-sm"
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            {query && (
              <button
                type="button"
                onClick={clearQuery}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/60 transition-colors"
                title="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 btn-gradient rounded-full text-sm font-medium shrink-0"
            >
              Search
            </button>
          </div>
        </form>
        {renderDropdown()}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div ref={containerRef} className={`relative w-full ${className}`}>
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative w-full flex items-center">
            <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1" aria-label="Search">
              <Search className="size-4 text-muted-foreground cursor-pointer hover:text-accent transition-colors" />
            </button>
            <input 
              type="text"
              autoFocus={autoFocus}
              value={query}
              onFocus={() => matchingUsers.length > 0 && setShowDropdown(true)}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/50 bg-background/80 pl-10 pr-9 text-sm outline-none transition focus:border-border focus:ring-1 focus:ring-accent/50" 
              placeholder={placeholder} 
              aria-label={placeholder} 
            />
            {query ? (
              <button
                type="button"
                onClick={clearQuery}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </form>
        {renderDropdown()}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full max-w-sm hidden lg:block ${className}`}>
      <form onSubmit={handleSearch} className="relative w-full">
        <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1">
          <Search className="size-4 text-muted-foreground cursor-pointer hover:text-accent transition-colors" />
        </button>
        <input 
          type="text"
          value={query}
          onFocus={() => matchingUsers.length > 0 && setShowDropdown(true)}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full rounded-xl border border-border/50 bg-background pl-10 pr-8 text-sm outline-none transition focus:border-border focus:ring-1 focus:ring-accent/50" 
          placeholder={placeholder} 
          aria-label={placeholder} 
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>
      {renderDropdown()}
    </div>
  );
}

// Re-exports for backwards compatibility
export { SearchForm as SearchInput };
export { SearchForm as NavSearch };
export function MobileNavSearch() {
  return <SearchForm variant="mobile" />;
}
