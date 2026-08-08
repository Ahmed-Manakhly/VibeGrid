import { IAuthRepository } from "../domain/IAuthRepository";

export class SyncUserUseCase {
  constructor(private repo: IAuthRepository) {}

  async execute(clerkId: string, clerkUser: any) {
    if (!clerkId || !clerkUser) return null;

    const existingUser = await this.repo.getUserByClerkId(clerkId);
    if (existingUser) return existingUser;

    const username = clerkUser.username ?? clerkUser.emailAddresses[0].emailAddress.split("@")[0];
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

    return this.repo.createUser({
      clerkId,
      name,
      username,
      email: clerkUser.emailAddresses[0].emailAddress,
      image: clerkUser.imageUrl,
    });
  }
}
