import { IMessagingRepository } from "../domain/IMessagingRepository";
import { DirectMessageEntity } from "../domain/MessageEntities";
import { ICacheService } from "@/shared/application/ports/ICacheService";

export class SendMessageUseCase {
  constructor(
    private readonly messagingRepo: IMessagingRepository,
    private readonly cacheService?: ICacheService
  ) {}

  async execute(params: {
    senderId: string;
    conversationId: string;
    content: string;
  }): Promise<DirectMessageEntity> {
    const trimmed = params.content ? params.content.trim() : "";
    if (!trimmed) {
      throw new Error("Message content cannot be empty");
    }
    if (trimmed.length > 2000) {
      throw new Error("Message exceeds maximum length of 2000 characters");
    }

    const isMember = await this.messagingRepo.isParticipant(params.conversationId, params.senderId);
    if (!isMember) {
      throw new Error("Unauthorized: Sender is not a participant in this conversation");
    }

    const message = await this.messagingRepo.saveMessage({
      conversationId: params.conversationId,
      senderId: params.senderId,
      content: trimmed,
    });

    // Realtime notification dispatch via Redis Pub/Sub if cache service available
    if (this.cacheService && typeof (this.cacheService as any).publish === 'function') {
      try {
        const conv = await this.messagingRepo.getConversationById(params.conversationId, params.senderId);
        if (conv) {
          const recipientIds = conv.participants
            .map((p) => p.userId)
            .filter((id) => id !== params.senderId);

          const eventPayload = JSON.stringify({
            recipientIds,
            messageId: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderName: message.sender?.name || message.sender?.username || "Someone",
            content: message.content,
            createdAt: message.createdAt.toISOString(),
          });

          await (this.cacheService as any).publish("realtime:direct_message", eventPayload);
        }
      } catch (err) {
        // Non-blocking error logging
      }
    }

    return message;
  }
}
