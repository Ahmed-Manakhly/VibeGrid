import { ConversationEntity, DirectMessageEntity } from './MessageEntities';

export interface IMessagingRepository {
  findOrCreateDirectConversation(userId1: string, userId2: string): Promise<ConversationEntity>;
  getConversationById(conversationId: string, currentUserId: string): Promise<ConversationEntity | null>;
  getUserConversations(userId: string, limit?: number, cursor?: string): Promise<{ conversations: ConversationEntity[]; nextCursor: string | null }>;
  isParticipant(conversationId: string, userId: string): Promise<boolean>;
  saveMessage(data: { conversationId: string; senderId: string; content: string }): Promise<DirectMessageEntity>;
  getMessages(conversationId: string, limit?: number, beforeCursor?: string, viewerId?: string): Promise<{ messages: DirectMessageEntity[]; nextCursor: string | null }>;
  markConversationAsRead(conversationId: string, userId: string): Promise<void>;
  deleteMessage(messageId: string, userId: string, scope: 'FOR_ME' | 'FOR_EVERYONE'): Promise<void>;
  deleteConversation(conversationId: string, userId: string): Promise<void>;
}
