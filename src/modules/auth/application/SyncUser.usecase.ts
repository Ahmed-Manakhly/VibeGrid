import { IAuthRepository } from "../domain/IAuthRepository";

export class SyncUserUseCase {
  constructor(private repo: IAuthRepository) {}

  async execute(userId: string, user: any) {
    if (!userId || !user) return null;

    const existingUser = await this.repo.getUserById(userId);
    if (existingUser) return existingUser;

    const username = user.username ?? (user.email ? user.email.split("@")[0] : 'user');
    const name = user.name || username;

    return this.repo.createUser({
      id: userId,
      name,
      username,
      email: user.email,
      image: user.image || null,
    });
  }
}
