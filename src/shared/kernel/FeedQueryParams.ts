export interface FeedQueryParams {
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

export interface FeedResult<T> {
  data: T[];
  nextCursor: string | null;
}
