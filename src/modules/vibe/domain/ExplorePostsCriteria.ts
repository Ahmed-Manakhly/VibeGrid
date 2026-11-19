export interface ExplorePostsCriteria {
  userId?: string;
  search?: string;
  tag?: string;
  category?: string;
  vibe?: string;
  authorId?: string;
  likedByUserId?: string;
  bookmarkedByUserId?: string;
  excludeAuthorIds?: string[];
  cursor?: string;
  limit?: number;
  sort?: string;
  communityId?: string;
  allowedCommunityIds?: string[];
}

export interface ExplorePostsResult<T> {
  data: T[];
  nextCursor: string | null;
}
