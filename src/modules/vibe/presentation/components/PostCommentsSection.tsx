'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import { SendIcon, LogInIcon } from 'lucide-react';
import { CommentCard } from './CommentCard';
import { useSession } from '@/components/auth/SessionProvider';
import { useRealtime } from '@/shared/infrastructure/socket/RealtimeProvider';
import { getPostCommentsAction, createComment } from '@/actions/post.action';
import { toast } from '@/components/ui/toast';

interface PostCommentsSectionProps {
  postId: string;
  postAuthorId?: string;
  dbUserId: string | null;
  initialComments: any[];
  isDetailPage?: boolean;
  communityId?: string | null;
  isCommunityMember?: boolean;
  showCommentInput?: boolean;
  onCommentCountChange?: (delta: number) => void;
}

export function PostCommentsSection({
  postId,
  postAuthorId,
  dbUserId,
  initialComments,
  isDetailPage = false,
  communityId,
  isCommunityMember = false,
  showCommentInput = false,
  onCommentCountChange,
}: PostCommentsSectionProps) {
  const { user, isAuthenticated } = useSession();
  const [localComments, setLocalComments] = useState<any[]>(initialComments || []);
  const [commentSort, setCommentSort] = useState<'recent' | 'oldest' | 'mine'>('recent');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedInitialBatch, setHasLoadedInitialBatch] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const { latestFeedSignal } = useRealtime();

  // Real-time live comments incoming (like chat message)
  useEffect(() => {
    if (!latestFeedSignal) return;

    if (latestFeedSignal.type === 'comment_added' && latestFeedSignal.postId === postId && latestFeedSignal.comment) {
      const incomingComment = latestFeedSignal.comment;
      // Do not duplicate if this is the comment created locally by current user
      setLocalComments((prev) => {
        if (prev.some((c) => c.id === incomingComment.id)) {
          return prev;
        }
        // If it's a top-level comment, prepend to local comments list
        if (!incomingComment.parentId) {
          return [incomingComment, ...prev];
        }
        // If it's a reply to an existing comment in view, append to replies
        return prev.map((c) => {
          if (c.id === incomingComment.parentId) {
            const replies = c.replies || [];
            if (replies.some((r: any) => r.id === incomingComment.id)) {
              return c;
            }
            return {
              ...c,
              replies: [...replies, incomingComment],
            };
          }
          return c;
        });
      });
      setHasLoadedInitialBatch(true);
    } else if (latestFeedSignal.type === 'comment_deleted') {
      const deletedId = (latestFeedSignal as any).commentId;
      if (deletedId) {
        setLocalComments((prev) => 
          prev
            .filter((c) => c.id !== deletedId)
            .map((c) => ({
              ...c,
              replies: (c.replies || []).filter((r: any) => r.id !== deletedId),
            }))
        );
      }
    }
  }, [latestFeedSignal, postId]);

  // Sync initial comments if provided
  useEffect(() => {
    if (initialComments && initialComments.length > 0) {
      setLocalComments(initialComments);
      setHasLoadedInitialBatch(true);
    }
  }, [initialComments]);

  // Load first batch on demand if empty and comments container opened or when sort changes on detail page
  const fetchComments = async (sortOption: 'recent' | 'oldest' | 'mine') => {
    setIsLoadingMore(true);
    try {
      const res = await getPostCommentsAction({ postId, limit: 5, sort: sortOption });
      if (res?.success && Array.isArray(res.data)) {
        setLocalComments(res.data);
        setNextCursor(res.nextCursor);
      }
    } catch {
      // Keep empty
    } finally {
      setIsLoadingMore(false);
      setHasLoadedInitialBatch(true);
    }
  };

  useEffect(() => {
    if (!hasLoadedInitialBatch && localComments.length === 0) {
      fetchComments(commentSort);
    }
  }, [postId, hasLoadedInitialBatch, localComments.length]);

  const handleSortChange = async (newSort: 'recent' | 'oldest' | 'mine') => {
    if (newSort === commentSort || isLoadingMore) return;
    setCommentSort(newSort);
    await fetchComments(newSort);
  };

  useEffect(() => {
    if (showCommentInput && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showCommentInput]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !nextCursor) return;
    try {
      setIsLoadingMore(true);
      const res = await getPostCommentsAction({ postId, cursor: nextCursor, limit: 5, sort: commentSort });
      if (res?.success && Array.isArray(res.data)) {
        setLocalComments((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const fresh = res.data.filter((c: any) => !existingIds.has(c.id));
          return [...prev, ...fresh];
        });
        setNextCursor(res.nextCursor);
      }
    } catch {
      toast.error('Failed to load more comments');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    const commentText = newComment;

    try {
      setIsCommenting(true);

      const result = await createComment(postId, commentText);
      if (result?.success && result.comment) {
        toast.success('Comment posted successfully');
        // Place own new comment at top of comments list
        setLocalComments((prev: any) => [result.comment, ...prev]);
        onCommentCountChange?.(1);
        setNewComment('');
      } else {
        toast.error(result?.error || 'Failed to create comment!');
        if (result?.requiresPolicy) {
          window.dispatchEvent(new CustomEvent('open-policy-prompt'));
        }
      }
    } catch {
      toast.error('Failed to create comment!');
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-brand-gold/30 bg-gradient-to-b from-brand-gold/15 via-brand-gold/5 to-transparent backdrop-blur-md shadow-lg shadow-brand-gold/5 p-3 sm:p-4 rounded-2xl border-x border-b border-brand-gold/20">
      {/* Top Comment Input Box */}
      {(isDetailPage || showCommentInput) && (
        isAuthenticated ? (
          communityId && !isCommunityMember ? (
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
              <span className="text-muted-foreground">
                Join this guild to participate in discussions and drop comments.
              </span>
              <Button size="sm" variant="outline" className="btn-gradient text-white h-7 px-3 text-xs" asChild>
                <Link href={`/communities`}>
                  Join Guild
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex space-x-3 pb-3 border-b border-border/30">
              <UserAvatar src={user?.image} name={user?.name} className="size-8 flex-shrink-0" />
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder="Drop a vibe..."
                  value={newComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                  className="min-h-[70px] resize-none bg-background border border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-border text-xs"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleAddComment}
                    size="sm"
                    className="btn-gradient flex items-center gap-1.5 h-7 px-3 text-xs"
                    disabled={!newComment.trim() || isCommenting}
                  >
                    {isCommenting ? (
                      'Dropping...'
                    ) : (
                      <>
                        <SendIcon className="size-3.5" />
                        <span>Comment</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="flex justify-center p-3 border rounded-xl bg-muted/30">
            <Button variant="outline" size="sm" className="gap-2 text-xs" asChild>
              <Link href="/login">
                <LogInIcon className="size-3.5" />
                Sign in to comment
              </Link>
            </Button>
          </div>
        )
      )}

      {/* Comments List Header & Sorter for Detail Page */}
      {isDetailPage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 pb-2 border-b border-border/30 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            Discussion ({localComments.length})
          </span>
          <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/40 text-[11px]">
            <button
              type="button"
              onClick={() => handleSortChange('recent')}
              className={`px-2.5 py-1 rounded-lg font-medium text-center transition-colors ${
                commentSort === 'recent'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:text-foreground'
              }`}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => handleSortChange('oldest')}
              className={`px-2.5 py-1 rounded-lg font-medium text-center transition-colors ${
                commentSort === 'oldest'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'hover:text-foreground'
              }`}
            >
              Oldest
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => handleSortChange('mine')}
                className={`px-2.5 py-1 rounded-lg font-medium text-center transition-colors ${
                  commentSort === 'mine'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'hover:text-foreground'
                }`}
              >
                My Comments
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {localComments.map((comment: any) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            dbUserId={dbUserId}
            postId={postId}
            postAuthorId={postAuthorId}
            onCommentCountChange={onCommentCountChange}
          />
        ))}

        {isLoadingMore && (
          <div className="space-y-3 py-2 animate-pulse">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-full bg-muted/60" />
              <div className="h-3 w-28 rounded bg-muted/60" />
            </div>
            <div className="h-3 w-full rounded bg-muted/40 ml-9" />
          </div>
        )}

        {/* Show More Comments Link / Button */}
        {nextCursor ? (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="text-xs font-semibold text-accent hover:underline transition-colors block py-1"
          >
            {isLoadingMore ? "Loading comments..." : "Show more comments ↓"}
          </button>
        ) : !isDetailPage && localComments.length > 5 ? (
          <Link
            href={`/explore/${postId}`}
            className="block text-xs font-semibold text-accent hover:underline transition-colors py-1"
          >
            View all comments in thread &rarr;
          </Link>
        ) : null}
      </div>
    </div>
  );
}
