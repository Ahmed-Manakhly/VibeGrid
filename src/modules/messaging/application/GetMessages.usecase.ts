import { IMessagingRepository } from "../domain/IMessagingRepository";
import { ConversationEntity, DirectMessageEntity } from "../domain/MessageEntities";

export class GetConversationsUseCase {
  constructor(private readonly messagingRepo: IMessagingRepository) {}

  async execute(userId: string): Promise<ConversationEntity[]> {
    if (!userId) throw new Error("User ID is required");
    return await this.messagingRepo.getUserConversations(userId);
  }
}

export class GetMessagesUseCase {
  constructor(private readonly messagingRepo: IMessagingRepository) {}

  async execute(
    conversationId: string,
    currentUserId: string,
    limit?: number,
    beforeCursor?: string
  ): Promise<{ messages: DirectMessageEntity[]; nextCursor: string | null }> {
    const isMember = await this.messagingRepo.isParticipant(conversationId, currentUserId);
    if (!isMember) {
      throw new Error("Unauthorized: You are not a participant in this conversation");
    }

    const result = await this.messagingRepo.getMessages(conversationId, limit, beforeCursor);
    
    // Automatically mark conversation as read when user fetches messages
    await this.messagingRepo.markConversationAsRead(conversationId, currentUserId);

    return result;
  }
}
