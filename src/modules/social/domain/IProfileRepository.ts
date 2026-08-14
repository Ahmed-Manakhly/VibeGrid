export interface IProfileRepository {
  getProfileByUsername(username: string): Promise<any | null>;
  updateProfile(clerkId: string, data: { name: string; bio: string; location: string; website: string; }): Promise<any | null>;
}
