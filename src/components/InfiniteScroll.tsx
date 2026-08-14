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
    <div className="flex flex-col gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} dbUserId={dbUserId} />
      ))}
      
      {nextCursor && (
        <div ref={ref} className="flex justify-center p-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {!nextCursor && posts.length > 0 && (
        <p className="text-center text-gray-500 text-sm mt-8 pb-8">
          You've reached the end of the feed.
        </p>
      )}
      
      {posts.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-4">🌵</div>
          <h3 className="text-xl font-medium text-white mb-2">No vibes found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
