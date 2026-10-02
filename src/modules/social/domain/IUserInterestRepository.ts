export interface IUserInterestRepository {
  getUserInterests(userId: string): Promise<Array<{ id: string; name: string; slug: string; emoji: string | null }>>;
  setUserInterests(userId: string, categoryIds: string[]): Promise<void>;
}
