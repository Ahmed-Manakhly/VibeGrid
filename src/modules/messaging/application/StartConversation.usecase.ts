import { IMessagingRepository } from "../domain/IMessagingRepository";
import { ConversationEntity } from "../domain/MessageEntities";
import { ITrustSafetyRepository } from "@/modules/safety/domain/ITrustSafetyRepository";

export class StartConversationUseCase {
  constructor(
    private readonly messagingRepo: IMessagingRepository,
    private readonly safetyRepo?: ITrustSafetyRepository
  ) {}

  async execute(currentUserId: string, targetUserId: string): Promise<ConversationEntity> {
    if (!currentUserId || !targetUserId) {
      throw new Error("Invalid parameters for starting conversation");
    }
    if (currentUserId === targetUserId) {
      throw new Error("Cannot start a conversation with yourself");
    }

    if (this.safetyRepo) {
      const isBlocked = await this.safetyRepo.isBlocked(currentUserId, targetUserId);
      if (isBlocked) {
        throw new Error("Cannot start a conversation with a blocked user");
      }
    }

    return await this.messagingRepo.findOrCreateDirectConversation(currentUserId, targetUserId);
  }
}

