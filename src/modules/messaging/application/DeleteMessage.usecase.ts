import { IMessagingRepository } from "../domain/IMessagingRepository";

export class DeleteMessageUseCase {
  constructor(private readonly messagingRepo: IMessagingRepository) {}

  async execute(
    messageId: string,
    userId: string,
    scope: 'FOR_ME' | 'FOR_EVERYONE'
  ): Promise<void> {
    if (!messageId || !userId) {
      throw new Error("Message ID and User ID are required");
    }
    await this.messagingRepo.deleteMessage(messageId, userId, scope);
  }
}

export class DeleteConversationUseCase {
  constructor(private readonly messagingRepo: IMessagingRepository) {}

  async execute(conversationId: string, userId: string): Promise<void> {
    if (!conversationId || !userId) {
      throw new Error("Conversation ID and User ID are required");
    }
    const isMember = await this.messagingRepo.isParticipant(conversationId, userId);
    if (!isMember) {
      throw new Error("Unauthorized: You are not a participant in this conversation");
    }
    await this.messagingRepo.deleteConversation(conversationId, userId);
  }
}

