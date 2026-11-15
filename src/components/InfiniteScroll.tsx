"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import PostCard from "@/modules/vibe/presentation/components/PostCard";
import { useSearchParams } from "next/navigation";
import { useRealtime } from "@/shared/infrastructure/socket/RealtimeProvider";

interface InfiniteScrollProps {
  initialPosts: any[];
  initialNextCursor: string | null;
  apiUrl: string;
  dbUserId: string | null;
  mode?: "infinite" | "manual";
  isTruncated?: boolean;
}

export function InfiniteScroll({ initialPosts, initialNextCursor, apiUrl, dbUserId, mode = "infinite", isTruncated = false }: InfiniteScrollProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [pendingFreshPosts, setPendingFreshPosts] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"thread" | "grid">("grid");
  const searchParams = useSearchParams();
  const { ref, inView } = useInView();
  const { latestFeedSignal } = useRealtime();

  const [prevSearchParams, setPrevSearchParams] = useState(searchParams.toString());

  // Reconcile initialPosts when server revalidates or searchParams change
  useEffect(() => {
    const currentParamsStr = searchParams.toString();
    if (currentParamsStr !== prevSearchParams) {
      setPrevSearchParams(currentParamsStr);
      setPosts(initialPosts);
      setNextCursor(initialNextCursor);
      return;
    }

    setPosts((prev) => {
      if (!prev || prev.length === 0) {
        setNextCursor(initialNextCursor);
        return initialPosts;
      }
      const existingIds = new Set(prev.map((p) => p.id));
      const newItems = initialPosts.filter((p) => !existingIds.has(p.id));
      if (newItems.length === 0) return prev;
      return [...newItems, ...prev];
    });
  }, [searchParams, initialPosts, initialNextCursor, prevSearchParams]);

  // Controlled Realtime Reconciliation: Prepend new posts without destroying loaded pagination
  useEffect(() => {
    // Listen for local delete events for instant optimistic unmounting
    const handleLocalDelete = (event: Event) => {
      const customEvent = event as CustomEvent<{ postId: string }>;
      const deletedId = customEvent.detail?.postId;
      if (deletedId) {
        setPosts((prev) => prev.filter((p) => p.id !== deletedId));
        setPendingFreshPosts((prev) => prev.filter((p) => p.id !== deletedId));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("vibe_deleted", handleLocalDelete);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("vibe_deleted", handleLocalDelete);
      }
    };
  }, []);

  useEffect(() => {
    if (!latestFeedSignal) return;

    if (latestFeedSignal.type === "post_deleted" && latestFeedSignal.postId) {
      setPosts((prev) => prev.filter((p) => p.id !== latestFeedSignal.postId));
      setPendingFreshPosts((prev) => prev.filter((p) => p.id !== latestFeedSignal.postId));
      return;
    }

    if (latestFeedSignal.type === "new_content" || latestFeedSignal.type === "post_updated") {
      const fetchLatest = async () => {
        try {
          const base = new URL(apiUrl, window.location.origin);
          const pageParams = new URLSearchParams(searchParams.toString());
          pageParams.forEach((value, key) => {
            base.searchParams.set(key, value);
          });
          base.searchParams.set("limit", "5");

          const res = await fetch(base.toString());
          const data = await res.json();

          if (data.data && Array.isArray(data.data)) {
            const existingIds = new Set(posts.map((p) => p.id));
            const freshPosts = data.data.filter((p: any) => !existingIds.has(p.id));
            
            if (freshPosts.length > 0) {
              // If user is at the top of the feed (scrollY < 100), auto-prepend smoothly
              if (window.scrollY < 100) {
                setPosts((prev) => {
                  const currentIds = new Set(prev.map((p) => p.id));
                  const unadded = freshPosts.filter((p: any) => !currentIds.has(p.id));
                  return [...unadded, ...prev];
                });
              } else {
                // Otherwise queue them in a floating banner to avoid disruptive layout jumps
                setPendingFreshPosts((prev) => {
                  const currentPendingIds = new Set(prev.map((p) => p.id));
                  const newPending = freshPosts.filter((p: any) => !currentPendingIds.has(p.id));
                  return [...newPending, ...prev];
                });
              }
            }
          }
        } catch (error) {
          console.error("Failed to reconcile realtime feed update", error);
        }
      };

      fetchLatest();
    }
  }, [latestFeedSignal, apiUrl, searchParams, posts]);

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
    if (mode === "infinite" && inView) {
      loadMore();
    }
  }, [inView, mode]);

  const handleShowPendingPosts = () => {
    if (pendingFreshPosts.length === 0) return;
    setPosts((prev) => [...pendingFreshPosts, ...prev]);
    setPendingFreshPosts([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full relative">
      {/* Floating Fresh Posts Notification Pill */}
      {pendingFreshPosts.length > 0 && (
        <div className="sticky top-20 z-20 flex justify-center mb-4 animate-in fade-in slide-in-from-top duration-300">
          <button
            onClick={handleShowPendingPosts}
            className="btn-gradient px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-white"
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>
              {pendingFreshPosts.length} new {pendingFreshPosts.length === 1 ? "vibe" : "vibes"} available &uarr;
            </span>
          </button>
        </div>
      )}

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
          <PostCard key={post.id} post={post} dbUserId={dbUserId} isTruncated={isTruncated} />
        ))}
      </div>
      
      {nextCursor && mode === "infinite" && (
        <div ref={ref} className="flex justify-center p-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {nextCursor && mode === "manual" && (
        <div className="flex justify-center p-8">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-sm font-medium transition-all"
          >
            {loading ? (
               <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
            ) : (
               "Load More"
            )}
          </button>
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
