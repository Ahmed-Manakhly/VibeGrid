"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import PostCard from "@/modules/vibe/presentation/components/PostCard";
import { useSearchParams, useRouter } from "next/navigation";
import { useRealtime } from "@/shared/infrastructure/socket/RealtimeProvider";
import { ArrowUpIcon, RotateCw } from "lucide-react";

interface InfiniteScrollProps {
  initialPosts: any[];
  initialNextCursor: string | null;
  apiUrl: string;
  dbUserId: string | null;
  mode?: "infinite" | "manual";
  isTruncated?: boolean;
  enableIngressPill?: boolean;
  scopedCommunityId?: string;
}

export function InfiniteScroll({ 
  initialPosts, 
  initialNextCursor, 
  apiUrl, 
  dbUserId, 
  mode = "infinite", 
  isTruncated = false,
  enableIngressPill = false,
  scopedCommunityId,
}: InfiniteScrollProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [unreadNewPostsCount, setUnreadNewPostsCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"thread" | "grid">("grid");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { ref, inView } = useInView();
  const { latestFeedSignal, clearLatestFeedSignal } = useRealtime();

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
      // Preserve existing ordering in client state; update post properties (likes, comments, counts) in-place without reshuffling positions
      const initialMap = new Map(initialPosts.map((p) => [p.id, p]));
      const updatedExisting = prev.map((p) => initialMap.get(p.id) || p);
      
      const existingIds = new Set(prev.map((p) => p.id));
      const brandNewItems = initialPosts.filter((p) => !existingIds.has(p.id));
      if (brandNewItems.length === 0) return updatedExisting;
      return [...brandNewItems, ...updatedExisting];
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
      }
    };

    // Listen for bookmark toggle events: immediately unmount on /bookmarks when unbookmarked
    const handleBookmarkToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ postId: string; isBookmarked: boolean }>;
      const { postId, isBookmarked } = customEvent.detail || {};
      if (
        !isBookmarked &&
        postId &&
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/bookmarks")
      ) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("vibe_deleted", handleLocalDelete);
      window.addEventListener("vibe_bookmark_toggled", handleBookmarkToggle);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("vibe_deleted", handleLocalDelete);
        window.removeEventListener("vibe_bookmark_toggled", handleBookmarkToggle);
      }
    };
  }, []);

  useEffect(() => {
    if (!latestFeedSignal) return;

    if (latestFeedSignal.type === "post_deleted" && latestFeedSignal.postId) {
      setPosts((prev) => prev.filter((p) => p.id !== latestFeedSignal.postId));
      return;
    }

    // Only main community feeds with enableIngressPill active should track incoming feed signals
    if (!enableIngressPill) {
      return;
    }

    // If this feed is scoped to a specific community, only react to vibes belonging to this community
    if (scopedCommunityId && latestFeedSignal.communityId !== scopedCommunityId) {
      return;
    }

    // If this feed is global/explore (no scopedCommunityId), do not alert on community-exclusive vibes
    if (!scopedCommunityId && latestFeedSignal.communityId) {
      return;
    }

    if (latestFeedSignal.type === "new_content" || latestFeedSignal.type === "post_updated") {
      // Do not count the author's own created post as an unread pill: the author already sees it
      if (latestFeedSignal.authorId && dbUserId && latestFeedSignal.authorId === dbUserId) {
        return;
      }
      setUnreadNewPostsCount((prev) => prev + 1);
    }
  }, [latestFeedSignal, enableIngressPill, scopedCommunityId, dbUserId]);

  const handleRefreshFeed = async () => {
    setIsRefreshing(true);
    setUnreadNewPostsCount(0);
    if (clearLatestFeedSignal) {
      clearLatestFeedSignal();
    }
    try {
      // Smoothly scroll to top
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      const base = new URL(apiUrl, window.location.origin);
      const pageParams = new URLSearchParams(searchParams.toString());
      pageParams.forEach((value, key) => {
        base.searchParams.set(key, value);
      });
      base.searchParams.set("limit", "12");

      const res = await fetch(base.toString(), { cache: "no-store" });
      const data = await res.json();
      if (data?.data && Array.isArray(data.data)) {
        setPosts(data.data);
        setNextCursor(data.nextCursor || null);
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to refresh feed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

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

  return (
    <div className="w-full relative">
      {/* Floating Fresh Posts Notification Pill (Sticky Top) */}
      {unreadNewPostsCount > 0 && (
        <div className="sticky top-16 z-50 flex justify-center mb-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <button
            onClick={handleRefreshFeed}
            disabled={isRefreshing}
            className="btn-gradient px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 text-white border border-white/20 ring-4 ring-primary/20 backdrop-blur-md"
          >
            <ArrowUpIcon className="size-4 animate-bounce shrink-0" />
            <span>
              {isRefreshing
                ? "Refreshing vibes..."
                : `${unreadNewPostsCount} new ${unreadNewPostsCount === 1 ? "vibe" : "vibes"} available ↑`}
            </span>
          </button>
        </div>
      )}

      {/* Thread / Grid Toggle */}
      {posts.length > 0 && (
        <div className="hidden sm:flex items-center justify-start gap-2 mb-6">
          <div className="view-switcher flex items-center gap-1">
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
      <div className={viewMode === "thread" ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-4 items-start"}>
        {posts.map((post) => (
          <div key={post.id} className="h-fit">
            <PostCard key={post.id} post={post} dbUserId={dbUserId} isTruncated={isTruncated} />
          </div>
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
