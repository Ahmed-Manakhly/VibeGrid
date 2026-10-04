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
  dbUserId: string | null;
  initialComments: any[];
  isDetailPage?: boolean;
}

export function PostCommentsSection({
  postId,
  dbUserId,
  initialComments,
  isDetailPage = false,
}: PostCommentsSectionProps) {
  const { user, isAuthenticated } = useSession();
  const [localComments, setLocalComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    setLocalComments(initialComments || []);
  }, [initialComments]);

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

      const result = await createComment(postId, commentText);
      if (result?.success) {
        toast.success('Comment posted successfully');
      } else {
        toast.error(result?.error || 'Failed to create comment!');
        setLocalComments((prev: any) => prev.filter((c: any) => c.id !== optimisticId));
        setNewComment(commentText);
      }
    } catch {
      toast.error('Failed to create comment!');
      setLocalComments((prev: any) => prev.filter((c: any) => c.id !== optimisticId));
      setNewComment(commentText);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <div className="space-y-4">
        {localComments.slice(0, isDetailPage ? 5 : 2).map((comment: any) => (
          <CommentCard key={comment.id} comment={comment} dbUserId={dbUserId} postId={postId} />
        ))}
        {localComments.length > (isDetailPage ? 5 : 2) && (
          <Link
            href={`/vibes/${postId}`}
            className="block text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            View all {localComments.length} comments &rarr;
          </Link>
        )}
      </div>
      {isAuthenticated ? (
        <div className="flex space-x-3">
          <UserAvatar src={user?.image} name={user?.name} className="size-8 flex-shrink-0" />
          <div className="flex-1">
            <Textarea
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
      ) : (
        <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/login">
              <LogInIcon className="size-4" />
              Sign in to comment
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
