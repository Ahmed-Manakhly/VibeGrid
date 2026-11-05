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
  isTruncated?: boolean;
  isDetailPage?: boolean;
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
  isTruncated = false,
  isDetailPage = false,
}: PostInteractiveContainerProps) {
  const [showComments, setShowComments] = useState(isDetailPage);

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
        commentsCount={initialComments.length}
        showComments={showComments}
        onToggleComments={() => setShowComments((prev) => !prev)}
        isTruncated={isTruncated}
      />

      {!isTruncated && showComments && (
        <PostCommentsSection
          postId={postId}
          postAuthorId={postAuthorId}
          dbUserId={dbUserId}
          initialComments={initialComments}
          isDetailPage={isDetailPage}
        />
      )}
    </>
  );
}
