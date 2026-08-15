"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import PostCard from "./PostCard";
import { useSearchParams } from "next/navigation";

interface InfiniteScrollProps {
  initialPosts: any[];
  initialNextCursor: string | null;
  apiUrl: string;
  dbUserId: string | null;
}

export function InfiniteScroll({ initialPosts, initialNextCursor, apiUrl, dbUserId }: InfiniteScrollProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"thread" | "grid">("thread");
  const searchParams = useSearchParams();
  const { ref, inView } = useInView();

  // Reset when searchParams change (so initialPosts take over)
  useEffect(() => {
    setPosts(initialPosts);
    setNextCursor(initialNextCursor);
  }, [searchParams, initialPosts, initialNextCursor]);

  const loadMore = async () => {
    if (loading || !nextCursor) return;
    
    setLoading(true);
    try {
      // Parse the base URL to preserve existing query params (e.g. /api/posts?authorId=123)
      const base = new URL(apiUrl, window.location.origin);
      
      // Add current search parameters from the page URL (e.g. ?q=foo)
      const pageParams = new URLSearchParams(searchParams.toString());
      pageParams.forEach((value, key) => {
        base.searchParams.set(key, value);
      });
      
      // Set the cursor for the next page
      base.searchParams.set("cursor", nextCursor);
      
      const res = await fetch(base.toString());
      const data = await res.json();
      
      if (data.data) {
        setPosts((prev) => [...prev, ...data.data]);
        setNextCursor(data.nextCursor);
      }
    } catch (error) {
      console.error("Failed to load more posts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inView) {
      loadMore();
    }
  }, [inView]);

  return (
    <div className="w-full">
      {/* Thread / Grid Toggle */}
      {posts.length > 0 && (
        <div className="hidden sm:flex items-center gap-2 mb-6">
          <div className="view-switcher">
            <button
              onClick={() => setViewMode("thread")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "thread"
                  ? "btn-gradient"
                  : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              Thread
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === "grid"
                  ? "btn-gradient"
                  : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              Grid
            </button>
          </div>
        </div>
      )}

      {/* Posts Container */}
      <div className={viewMode === "thread" ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} dbUserId={dbUserId} />
        ))}
      </div>
      
      {nextCursor && (
        <div ref={ref} className="flex justify-center p-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {!nextCursor && posts.length > 0 && (
        <p className="text-center text-muted-foreground text-sm mt-8 pb-8">
          You've reached the end of the feed.
        </p>
      )}
      
      {posts.length === 0 && (
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🌵</div>
          <h3 className="text-xl font-medium text-foreground mb-2">No vibes found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
