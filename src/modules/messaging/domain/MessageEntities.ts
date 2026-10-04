export interface ConversationParticipantEntity {
  conversationId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt: Date;
  user?: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
}

export interface DirectMessageEntity {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender?: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
}

export interface ConversationEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participants: ConversationParticipantEntity[];
  latestMessage?: DirectMessageEntity | null;
  unreadCount?: number;
}
