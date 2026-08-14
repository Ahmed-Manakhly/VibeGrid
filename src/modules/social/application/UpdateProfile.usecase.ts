import { IProfileRepository } from "../domain/IProfileRepository";

export class UpdateProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(clerkId: string, data: { name: string; bio: string; location: string; website: string; }) {
    if (!clerkId) {
      throw new Error("Unauthorized");
    }
    const profile = await this.profileRepository.updateProfile(clerkId, data);
    return { success: true, user: profile };
  }
}
