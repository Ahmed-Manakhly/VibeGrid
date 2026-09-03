import { IProfileRepository } from "../domain/IProfileRepository";

export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(userId: string, data: { name?: string; username?: string; bio?: string; location?: string; website?: string; image?: string }) {
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const profile = await this.profileRepository.updateProfile(userId, data);
    return { success: true, user: profile };
  }
}
