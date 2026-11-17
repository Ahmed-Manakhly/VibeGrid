export interface ISocialRepository {
  getSuggestedUsers(currentUserId?: string): Promise<any[]>;
  searchUsers(query: string, limit?: number, viewerId?: string): Promise<any[]>;
  getFollow(followerId: string, followingId: string): Promise<any>;
  addFollow(followerId: string, followingId: string): Promise<void>;
  removeFollow(followerId: string, followingId: string): Promise<void>;
  getFollowerIds(followingId: string): Promise<string[]>;
  getFollowingIds(followerId: string): Promise<string[]>;
}
