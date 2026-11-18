'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import { SendIcon, LogInIcon } from 'lucide-react';
import { CommentCard } from './CommentCard';
import { useSession } from '@/components/auth/SessionProvider';
import { createComment } from '@/actions/post.action';
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
  const [localComments, setLocalComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(isDetailPage);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalComments(initialComments || []);
  }, [initialComments]);

  useEffect(() => {
    if (showCommentInput && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [showCommentInput]);

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    const commentText = newComment;
    const optimisticId = `optimistic-${Date.now()}`;

    try {
      setIsCommenting(true);
      setNewComment('');

      const optimisticComment = {
        id: optimisticId,
        content: commentText,
        authorId: dbUserId,
        postId: postId,
        createdAt: new Date().toISOString(),
        author: {
          id: dbUserId,
          name: user?.name || user?.username || user?.email?.split('@')[0] || 'You',
          username: user?.username || user?.name || '',
          image: user?.image || null,
        },
      };

      setLocalComments((prev: any) => [...prev, optimisticComment]);
      onCommentCountChange?.(1);

      const result = await createComment(postId, commentText);
      if (result?.success) {
        toast.success('Comment posted successfully');
        if (result.comment?.id) {
          setLocalComments((prev: any) =>
            prev.map((c: any) => (c.id === optimisticId ? { ...c, id: result.comment.id } : c))
          );
        }
      } else {
        toast.error(result?.error || 'Failed to create comment!');
        if (result?.requiresPolicy) {
          window.dispatchEvent(new CustomEvent('open-policy-prompt'));
        }
        setLocalComments((prev: any) => prev.filter((c: any) => c.id !== optimisticId));
        onCommentCountChange?.(-1);
        setNewComment(commentText);
      }
    } catch {
      toast.error('Failed to create comment!');
      setLocalComments((prev: any) => prev.filter((c: any) => c.id !== optimisticId));
      onCommentCountChange?.(-1);
      setNewComment(commentText);
    } finally {
      setIsCommenting(false);
    }
  };

  const visibleComments = isExpanded ? localComments : localComments.slice(0, 2);
  const remainingCount = localComments.length - visibleComments.length;

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <div className="space-y-4">
        {visibleComments.map((comment: any) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            dbUserId={dbUserId}
            postId={postId}
            postAuthorId={postAuthorId}
            onCommentCountChange={onCommentCountChange}
          />
        ))}

        {/* View all comments controls */}
        {remainingCount > 0 && (
          isDetailPage ? (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors block"
            >
              Show {remainingCount} more {remainingCount === 1 ? 'comment' : 'comments'} &darr;
            </button>
          ) : (
            <Link
              href={`/explore/${postId}`}
              className="block text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              View all {localComments.length} comments &rarr;
            </Link>
          )
        )}
      </div>
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
            <div className="flex space-x-3">
              <UserAvatar src={user?.image} name={user?.name} className="size-8 flex-shrink-0" />
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  placeholder="Drop a vibe..."
                  value={newComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                  className="min-h-[80px] resize-none bg-background border border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-border"
                />
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={handleAddComment}
                    size="sm"
                    className="btn-gradient flex items-center gap-2"
                    disabled={!newComment.trim() || isCommenting}
                  >
                    {isCommenting ? (
                      'Dropping...'
                    ) : (
                      <>
                        <SendIcon className="size-4" />
                        Vibe
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/login">
                <LogInIcon className="size-4" />
                Sign in to comment
              </Link>
            </Button>
          </div>
        )
      )}
    </div>
  );
}
