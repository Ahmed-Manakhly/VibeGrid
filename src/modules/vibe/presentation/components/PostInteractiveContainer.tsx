'use client';

import React, { useState } from 'react';
import { PostActions } from './PostActions';
import { PostCommentsSection } from './PostCommentsSection';

interface PostInteractiveContainerProps {
  postId: string;
  postAuthorId?: string;
  dbUserId: string | null;
  initialLikes: number;
  initialLiked: boolean;
  likesList: any[];
  initialBookmarks: number;
  initialBookmarked: boolean;
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
  initialBookmarks,
  initialBookmarked,
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
        initialBookmarks={initialBookmarks}
        initialBookmarked={initialBookmarked}
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
