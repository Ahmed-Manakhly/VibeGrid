import { IVibeRepository } from "../domain/IVibeRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";

export class DeleteVibeUseCase {
  constructor(
    private repo: IVibeRepository,
    private eventBus?: IEventBus
  ) {}

  async execute(vibeId: string, authorId: string) {
    const result = await this.repo.deletePost(vibeId, authorId);
    if (result.success && this.eventBus) {
      await this.eventBus.publish("PostDeletedEvent", {
        postId: vibeId,
        authorId,
        timestamp: new Date(),
      });
    }
    return result;
  }
}
