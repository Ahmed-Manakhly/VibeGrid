import { IMessagingRepository } from "../domain/IMessagingRepository";
import { ConversationEntity } from "../domain/MessageEntities";

export class StartConversationUseCase {
  constructor(private readonly messagingRepo: IMessagingRepository) {}

  async execute(currentUserId: string, targetUserId: string): Promise<ConversationEntity> {
    if (!currentUserId || !targetUserId) {
      throw new Error("Invalid parameters for starting conversation");
    }
    if (currentUserId === targetUserId) {
      throw new Error("Cannot start a conversation with yourself");
    }
    return await this.messagingRepo.findOrCreateDirectConversation(currentUserId, targetUserId);
  }
}
