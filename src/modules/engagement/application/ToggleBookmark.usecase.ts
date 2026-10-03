import { IEngagementRepository } from "../domain/IEngagementRepository";
import { IEventBus } from "@/shared/domain/events/IEventBus";

export class ToggleBookmarkUseCase {
  constructor(
    private engagementRepository: IEngagementRepository,
    private eventBus: IEventBus
  ) {}

  async execute(vibeId: string, userId: string) {
    const result = await this.engagementRepository.toggleBookmark(vibeId, userId);
    return result;
  }
}
