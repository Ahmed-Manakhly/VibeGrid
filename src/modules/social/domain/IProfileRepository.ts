export interface IProfileRepository {
  getProfileByUsername(username: string): Promise<any | null>;
  updateProfile(userId: string, data: { name?: string; username?: string; bio?: string; location?: string; website?: string; image?: string; avatarMediaId?: string }): Promise<any | null>;
}
