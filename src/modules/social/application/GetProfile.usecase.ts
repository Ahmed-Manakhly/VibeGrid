import { IProfileRepository } from "../domain/IProfileRepository";

export class GetProfileUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(username: string) {
    if (!username) {
      throw new Error("Username is required");
    }
    const profile = await this.profileRepository.getProfileByUsername(username);
    if (!profile) {
      throw new Error("Profile not found");
    }
    return profile;
  }
}
