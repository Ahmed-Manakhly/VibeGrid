export interface SyncUserDTO {
  clerkId: string;
  name: string;
  username: string;
  email: string;
  image: string;
}

export interface IAuthRepository {
  getUserByClerkId(clerkId: string): Promise<any>;
  createUser(data: SyncUserDTO): Promise<any>;
}
