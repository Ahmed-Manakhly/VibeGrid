'use client';

import React, { useState, useEffect } from 'react';
import { PostActions } from './PostActions';
import { PostCommentsSection } from './PostCommentsSection';
import { useRealtime } from '@/shared/infrastructure/socket/RealtimeProvider';

interface PostInteractiveContainerProps {
  postId: string;
  postAuthorId?: string;
  dbUserId: string | null;
  initialLikes: number;
  initialLiked: boolean;
  likesList: any[];
  initialReGrids: number;
  initialReGridded: boolean;
  initialComments: any[];
  initialCommentsCount?: number;
  isTruncated?: boolean;
  isDetailPage?: boolean;
  communityId?: string | null;
  isCommunityMember?: boolean;
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

export function PostInteractiveContainer({
  postId,
  postAuthorId,
  dbUserId,
  initialLikes,
  initialLiked,
  likesList,
  initialReGrids,
  initialReGridded,
  initialComments,
  initialCommentsCount,
  isTruncated = false,
  isDetailPage = false,
  communityId,
  isCommunityMember = false,
  targetPostData,
}: PostInteractiveContainerProps) {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentsCount, setCommentsCount] = useState<number>(
    initialCommentsCount ?? initialComments.length
  );
  const { latestFeedSignal } = useRealtime();

  // Sync internal commentsCount when server revalidates or parent props update
  useEffect(() => {
    if (typeof initialCommentsCount === 'number') {
      setCommentsCount(initialCommentsCount);
    }
  }, [initialCommentsCount]);

  // Listen to realtime comment updates for this post
  useEffect(() => {
    if (!latestFeedSignal || latestFeedSignal.postId !== postId) return;

    if (latestFeedSignal.type === 'comment_added') {
      // If the comment was created by another user, increment balloon counter
      // (author's own local comment addition is already incremented via onCommentCountChange)
      if (latestFeedSignal.authorId && dbUserId && latestFeedSignal.authorId === dbUserId) {
        return;
      }
      if (!latestFeedSignal.comment?.parentId) {
        setCommentsCount((prev) => prev + 1);
      }
    } else if (latestFeedSignal.type === 'comment_deleted') {
      setCommentsCount((prev) => Math.max(0, prev - 1));
    }
  }, [latestFeedSignal, postId, dbUserId]);

  const hasComments = initialComments && initialComments.length > 0;
  // Comments list should be visible if it is detail page, or if the post has existing comments, or if user opened the comment box
  const shouldRenderCommentsSection = isDetailPage || hasComments || showCommentInput;

  return (
    <>
      <PostActions
        postId={postId}
        dbUserId={dbUserId}
        initialLikes={initialLikes}
        initialLiked={initialLiked}
        likesList={likesList}
        initialReGrids={initialReGrids}
        initialReGridded={initialReGridded}
        commentsCount={commentsCount}
        showComments={showCommentInput}
        onToggleComments={() => setShowCommentInput((prev) => !prev)}
        isTruncated={isTruncated}
        targetPostData={targetPostData}
      />

      {!isTruncated && shouldRenderCommentsSection && (
        <PostCommentsSection
          postId={postId}
          postAuthorId={postAuthorId}
          dbUserId={dbUserId}
          initialComments={initialComments}
          totalCommentsCount={commentsCount}
          isDetailPage={isDetailPage}
          communityId={communityId}
          isCommunityMember={isCommunityMember}
          showCommentInput={showCommentInput}
          onCommentCountChange={(delta: number) => setCommentsCount((prev) => Math.max(0, prev + delta))}
        />
      )}
    </>
  );
}
