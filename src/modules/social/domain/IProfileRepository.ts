export interface IProfileRepository {
  getProfileByUsername(username: string): Promise<any | null>;
  getUserById?(id: string): Promise<{ id: string; username: string } | null>;
  updateProfile(
    userId: string,
    data: {
      name?: string;
      username?: string;
      bio?: string;
      location?: string;
      website?: string;
      image?: string;
      avatarMediaId?: string;
      techStack?: any;
      developerLinks?: any;
      isPolicyAccepted?: boolean;
      policyAcceptedAt?: Date;
    }
  ): Promise<any | null>;
}
