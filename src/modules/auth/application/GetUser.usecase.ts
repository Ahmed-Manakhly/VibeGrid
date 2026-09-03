import { IAuthRepository } from "../domain/IAuthRepository";

export class GetUserUseCase {
  constructor(private repo: IAuthRepository) {}

  async execute(userId: string) {
    if (!userId) return null;
    return this.repo.getUserById(userId);
  }

  async getDbUserId(userId: string): Promise<string | null> {
    if (!userId) return null;
    const user = await this.repo.getUserById(userId);
    if (!user) throw new Error("user not found!");
    return user.id;
  }
}
