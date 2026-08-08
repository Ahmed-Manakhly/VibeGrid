import { IAuthRepository } from "../domain/IAuthRepository";

export class GetUserUseCase {
  constructor(private repo: IAuthRepository) {}

  async execute(clerkId: string) {
    if (!clerkId) return null;
    return this.repo.getUserByClerkId(clerkId);
  }

  async getDbUserId(clerkId: string): Promise<string | null> {
    if (!clerkId) return null;
    const user = await this.repo.getUserByClerkId(clerkId);
    if (!user) throw new Error("user not found!");
    return user.id;
  }
}
