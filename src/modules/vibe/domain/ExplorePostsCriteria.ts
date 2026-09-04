export interface ExplorePostsCriteria {
  userId?: string;
  search?: string;
  tag?: string;
  category?: string;
  vibe?: string;
  authorId?: string;
  likedByUserId?: string;
  cursor?: string;
  limit?: number;
  sort?: string;
}

export interface ExplorePostsResult<T> {
  data: T[];
  nextCursor: string | null;
}
