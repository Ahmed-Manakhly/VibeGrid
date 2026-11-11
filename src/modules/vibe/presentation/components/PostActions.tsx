'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HeartIcon, RepeatIcon, BookmarkIcon, MessageCircleIcon, MessageSquareQuote } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { useSession } from '@/components/auth/SessionProvider';
import { toggleLike, toggleBookmark, toggleReGrid } from '@/actions/post.action';
import { toast } from '@/components/ui/toast';
import { QuoteVibeDialog } from '@/components/QuoteVibeDialog';

interface PostActionsProps {
  postId: string;
  dbUserId: string | null;
  initialLikes: number;
  initialLiked: boolean;
  likesList: any[];
  initialBookmarks: number;
  initialBookmarked: boolean;
  initialReGrids: number;
  initialReGridded: boolean;
  commentsCount: number;
  showComments: boolean;
  onToggleComments: () => void;
  isTruncated?: boolean;
  targetPostData?: {
    id: string;
    content: string | null;
    mediaUrl?: string | null;
    postType?: string | null;
    createdAt: Date | string;
    author: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  };
}

export function PostActions({
  postId,
  dbUserId,
  initialLikes,
  initialLiked,
  likesList,
  initialBookmarks,
  initialBookmarked,
  initialReGrids,
  initialReGridded,
  commentsCount,
  showComments,
  onToggleComments,
  isTruncated = false,
  targetPostData,
}: PostActionsProps) {
  const { isAuthenticated } = useSession();

  const [hasLiked, setHasLiked] = useState(initialLiked);
  const [optimisticLikes, setOptimisticLikes] = useState(initialLikes);
  const [isLiking, setIsLiking] = useState(false);

  const [hasBookmarked, setHasBookmarked] = useState(initialBookmarked);
  const [optimisticBookmarks, setOptimisticBookmarks] = useState(initialBookmarks);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const [hasReGridded, setHasReGridded] = useState(initialReGridded);
  const [optimisticReGrids, setOptimisticReGrids] = useState(initialReGrids);
  const [isReGridding, setIsReGridding] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      setHasLiked((prev) => !prev);
      setOptimisticLikes((prev) => (hasLiked ? prev - 1 : prev + 1));
      await toggleLike(postId);
    } catch {
      setOptimisticLikes(initialLikes);
      setHasLiked(initialLiked);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async () => {
    if (isBookmarking) return;
    try {
      setIsBookmarking(true);
      const nextBookmarked = !hasBookmarked;
      setHasBookmarked(nextBookmarked);
      setOptimisticBookmarks((prev) => (hasBookmarked ? Math.max(0, prev - 1) : prev + 1));
      const res = await toggleBookmark(postId);
      if (!res?.success) {
        setHasBookmarked(hasBookmarked);
        setOptimisticBookmarks(initialBookmarks);
        toast.error(res?.error || 'Failed to update bookmark');
      } else {
        toast.success(nextBookmarked ? 'Vibe saved to bookmarks' : 'Removed from bookmarks');
      }
    } catch {
      setHasBookmarked(hasBookmarked);
      setOptimisticBookmarks(initialBookmarks);
      toast.error('Failed to update bookmark');
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleReGrid = async () => {
    if (isReGridding) return;
    try {
      setIsReGridding(true);
      const nextReGridded = !hasReGridded;
      setHasReGridded(nextReGridded);
      setOptimisticReGrids((prev) => (hasReGridded ? Math.max(0, prev - 1) : prev + 1));
      const res = await toggleReGrid(postId);
      if (!res?.success) {
        setHasReGridded(hasReGridded);
        setOptimisticReGrids(initialReGrids);
        toast.error(res?.error || 'Failed to update regrid');
      } else {
        toast.success(nextReGridded ? 'Vibe re-gridded to your feed' : 'Re-grid removed');
      }
    } catch {
      setHasReGridded(hasReGridded);
      setOptimisticReGrids(initialReGrids);
      toast.error('Failed to update regrid');
    } finally {
      setIsReGridding(false);
    }
  };

  return (
    <div className="flex items-center pt-2 space-x-4">
      {/* Like Button */}
      <div className="relative group/like inline-flex items-center">
        {isAuthenticated ? (
          <Button
            className={`text-muted-foreground gap-2 hover:bg-transparent ${
              hasLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
            }`}
            variant="ghost"
            size="sm"
            onClick={handleLike}
          >
            <HeartIcon className={`size-5 ${hasLiked ? 'fill-current' : ''}`} />
            <span>{optimisticLikes}</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-2 hover:bg-transparent hover:text-red-500"
            asChild
          >
            <Link href="/login">
              <HeartIcon className="size-5" />
              <span>{optimisticLikes}</span>
            </Link>
          </Button>
        )}

        {likesList && likesList.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/like:block group-focus-within/like:block z-30 min-w-[200px] max-w-[260px] p-2.5 rounded-xl bg-card border border-border/80 shadow-2xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 pointer-events-auto">
            <p className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 border-b border-border/40 pb-1">
              Liked by ({optimisticLikes})
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {likesList.slice(0, 10).map((likeItem: any, idx: number) => {
                const reactor = likeItem.user;
                const reactorName = reactor?.name || reactor?.username || 'Anonymous';
                const reactorHandle = reactor?.username ? `@${reactor.username}` : '';
                return (
                  <Link
                    key={idx}
                    href={reactor?.username ? `/profile/${reactor.username}` : '#'}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors text-xs text-foreground truncate group/user"
                  >
                    <UserAvatar src={reactor?.image} name={reactorName} className="size-6 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium group-hover/user:underline">{reactorName}</p>
                      {reactorHandle && <p className="text-[10px] font-mono text-muted-foreground truncate">{reactorHandle}</p>}
                    </div>
                  </Link>
                );
              })}
              {optimisticLikes > 10 && (
                <p className="text-[10px] text-muted-foreground pt-1 italic text-center">
                  and {optimisticLikes - 10} others...
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comment Toggle Button */}
      {!isTruncated && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleComments}
          className="text-muted-foreground gap-2 hover:bg-transparent hover:text-accent"
        >
          <MessageCircleIcon className={`size-5 ${showComments ? 'fill-accent text-accent' : ''}`} />
          <span>{commentsCount}</span>
        </Button>
      )}

      {/* ReGrid Button */}
      {isAuthenticated ? (
        <Button
          className={`text-muted-foreground gap-2 hover:bg-transparent ${
            hasReGridded ? 'text-green-500 hover:text-green-600' : 'hover:text-green-500'
          }`}
          variant="ghost"
          size="sm"
          onClick={handleReGrid}
          title="Re-Grid Vibe"
        >
          <RepeatIcon className={`size-5 ${hasReGridded ? 'text-green-500' : ''}`} />
          <span>{optimisticReGrids}</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-2 hover:bg-transparent hover:text-green-500"
          asChild
        >
          <Link href="/login">
            <RepeatIcon className="size-5" />
            <span>{optimisticReGrids}</span>
          </Link>
        </Button>
      )}

      {/* Quote Vibe Button */}
      {targetPostData && (
        isAuthenticated ? (
          <Button
            className="text-muted-foreground gap-1.5 hover:bg-transparent hover:text-primary transition-colors"
            variant="ghost"
            size="sm"
            onClick={() => setIsQuoteOpen(true)}
            title="Quote Vibe with commentary"
          >
            <MessageSquareQuote className="size-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground gap-1.5 hover:bg-transparent hover:text-primary"
            asChild
          >
            <Link href="/login" title="Log in to quote vibe">
              <MessageSquareQuote className="size-5" />
            </Link>
          </Button>
        )
      )}

      {/* Bookmark Button */}
      {isAuthenticated ? (
        <Button
          className={`ml-auto text-muted-foreground gap-2 hover:bg-transparent ${
            hasBookmarked ? 'text-primary hover:text-primary/90' : 'hover:text-primary'
          }`}
          variant="ghost"
          size="sm"
          onClick={handleBookmark}
        >
          <BookmarkIcon className={`size-5 ${hasBookmarked ? 'fill-primary text-primary' : ''}`} />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground gap-2 hover:bg-transparent hover:text-primary"
          asChild
        >
          <Link href="/login">
            <BookmarkIcon className="size-5" />
          </Link>
        </Button>
      )}

      {/* Quote Vibe Modal */}
      {targetPostData && isQuoteOpen && (
        <QuoteVibeDialog
          isOpen={isQuoteOpen}
          onClose={() => setIsQuoteOpen(false)}
          targetPost={targetPostData}
        />
      )}
    </div>
  );
}
