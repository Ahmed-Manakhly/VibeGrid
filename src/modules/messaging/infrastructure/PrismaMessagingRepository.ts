import { PrismaClient } from "@prisma/client";
import { IMessagingRepository } from "../domain/IMessagingRepository";
import { ConversationEntity, DirectMessageEntity } from "../domain/MessageEntities";

export class PrismaMessagingRepository implements IMessagingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findOrCreateDirectConversation(userId1: string, userId2: string): Promise<ConversationEntity> {
    if (userId1 === userId2) {
      throw new Error("Cannot create a conversation with yourself");
    }

    // Find existing direct conversation shared by both users
    const existing = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, name: true, image: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: { id: true, username: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (existing) {
      return {
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
        participants: existing.participants,
        latestMessage: existing.messages[0] || null,
      };
    }

    // Create new direct conversation
    const created = await this.prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: userId1 },
            { userId: userId2 },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, name: true, image: true },
            },
          },
        },
      },
    });

    return {
      id: created.id,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
      participants: created.participants,
      latestMessage: null,
    };
  }

  async getConversationById(conversationId: string, currentUserId: string): Promise<ConversationEntity | null> {
    const isMember = await this.isParticipant(conversationId, currentUserId);
    if (!isMember) return null;

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, name: true, image: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: { id: true, username: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (!conv) return null;

    const userParticipant = conv.participants.find((p: any) => p.userId === currentUserId);
    const lastRead = userParticipant ? userParticipant.lastReadAt : new Date(0);

    const unreadCount = await this.prisma.directMessage.count({
      where: {
        conversationId,
        createdAt: { gt: lastRead },
        senderId: { not: currentUserId },
      },
    });

    return {
      id: conv.id,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      participants: conv.participants,
      latestMessage: conv.messages[0] || null,
      unreadCount,
    };
  }

  async getUserConversations(userId: string): Promise<ConversationEntity[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, name: true, image: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: { id: true, username: true, name: true, image: true },
            },
          },
        },
      },
    });

    return Promise.all(
      conversations.map(async (conv: any) => {
        const participant = conv.participants.find((p: any) => p.userId === userId);
        const lastRead = participant ? participant.lastReadAt : new Date(0);

        const unreadCount = await this.prisma.directMessage.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: lastRead },
            senderId: { not: userId },
          },
        });

        return {
          id: conv.id,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          participants: conv.participants,
          latestMessage: conv.messages[0] || null,
          unreadCount,
        };
      })
    );
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const p = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
    return Boolean(p);
  }

  async saveMessage(data: { conversationId: string; senderId: string; content: string }): Promise<DirectMessageEntity> {
    const isMember = await this.isParticipant(data.conversationId, data.senderId);
    if (!isMember) {
      throw new Error("Unauthorized: Sender is not a participant in this conversation");
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const msg = await tx.directMessage.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
        },
        include: {
          sender: {
            select: { id: true, username: true, name: true, image: true },
          },
        },
      });

      await tx.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    return message;
  }

  async getMessages(
    conversationId: string,
    limit: number = 20,
    beforeCursor?: string
  ): Promise<{ messages: DirectMessageEntity[]; nextCursor: string | null }> {
    const take = limit + 1;
    let beforeMessageCreatedAt: Date | undefined;

    if (beforeCursor) {
      const cursorMsg = await this.prisma.directMessage.findUnique({
        where: { id: beforeCursor },
        select: { createdAt: true },
      });
      if (cursorMsg) {
        beforeMessageCreatedAt = cursorMsg.createdAt;
      }
    }

    const messages = await this.prisma.directMessage.findMany({
      where: {
        conversationId,
        ...(beforeMessageCreatedAt ? { createdAt: { lt: beforeMessageCreatedAt } } : {}),
      },
      take,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, username: true, name: true, image: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    // Return chronological order (oldest to newest for chat view)
    return {
      messages: messages.reverse(),
      nextCursor,
    };
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
  }
}
