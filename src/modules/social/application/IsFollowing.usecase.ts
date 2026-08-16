import { ISocialRepository } from "../domain/ISocialRepository";

export class IsFollowingUseCase {
  constructor(private repo: ISocialRepository) {}

  async execute(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.repo.getFollow(followerId, followingId);
    return !!follow;
  }
}
