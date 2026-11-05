export interface ITagFollowRepository {
  toggleFollow(userId: string, tagId: string): Promise<{ isFollowing: boolean; followersCount: number }>;
  isFollowing(userId: string, tagId: string): Promise<boolean>;
  getFollowedTagIds(userId: string): Promise<string[]>;
  getFollowedTagSlugs(userId: string): Promise<string[]>;
}
