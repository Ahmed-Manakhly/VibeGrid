export interface ISocialRepository {
  getSuggestedUsers(currentUserId: string): Promise<any[]>;
  getFollow(followerId: string, followingId: string): Promise<any>;
  addFollow(followerId: string, followingId: string): Promise<void>;
  removeFollow(followerId: string, followingId: string): Promise<void>;
}
