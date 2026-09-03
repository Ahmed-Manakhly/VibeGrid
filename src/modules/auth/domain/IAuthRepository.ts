export interface SyncUserDTO {
  id: string;
  name: string;
  username: string;
  email: string;
  image: string;
}

export interface IAuthRepository {
  getUserById(id: string): Promise<any>;
  createUser(data: SyncUserDTO): Promise<any>;
}
