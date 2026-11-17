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
      // If conversation was hidden for either user (e.g. earlier "delete for me"), unhide for requester
      await this.prisma.conversationParticipant.updateMany({
        where: {
          conversationId: existing.id,
          userId: userId1,
          isHidden: true,
        },
        data: {
          isHidden: false,
        },
      });

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
          some: {
            userId,
            isHidden: false,
          },
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
        const clearedAt = participant ? participant.clearedAt : null;

        const unreadCount = await this.prisma.directMessage.count({
          where: {
            conversationId: conv.id,
            createdAt: { gt: lastRead },
            ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
            senderId: { not: userId },
            NOT: {
              deletedForUserIds: { has: userId },
            },
          },
        });

        // Filter latest message if cleared or deleted for this user
        let latestMessage = conv.messages[0] || null;
        if (latestMessage) {
          if (clearedAt && new Date(latestMessage.createdAt) <= new Date(clearedAt)) {
            latestMessage = null;
          } else if (latestMessage.deletedForUserIds?.includes(userId)) {
            latestMessage = null;
          }
        }

        return {
          id: conv.id,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          participants: conv.participants,
          latestMessage,
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

      // Dual-copy resurfacing: If conversation was hidden for any participant (e.g. deleted), unhide it upon receiving new message
      await tx.conversationParticipant.updateMany({
        where: {
          conversationId: data.conversationId,
          isHidden: true,
        },
        data: {
          isHidden: false,
        },
      });

      return msg;
    });

    return message;
  }

  async getMessages(
    conversationId: string,
    limit: number = 20,
    beforeCursor?: string,
    viewerId?: string
  ): Promise<{ messages: DirectMessageEntity[]; nextCursor: string | null }> {
    const take = limit + 1;
    let beforeMessageCreatedAt: Date | undefined;
    let clearedAt: Date | null = null;

    if (viewerId) {
      const participant = await this.prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId, userId: viewerId },
        },
        select: { clearedAt: true },
      });
      if (participant?.clearedAt) {
        clearedAt = participant.clearedAt;
      }
    }

    if (beforeCursor) {
      const cursorMsg = await this.prisma.directMessage.findUnique({
        where: { id: beforeCursor },
        select: { createdAt: true },
      });
      if (cursorMsg) {
        beforeMessageCreatedAt = cursorMsg.createdAt;
      }
    }

    const whereCondition: any = {
      conversationId,
      ...(beforeMessageCreatedAt ? { createdAt: { lt: beforeMessageCreatedAt } } : {}),
      ...(clearedAt ? { createdAt: { gt: clearedAt } } : {}),
    };

    if (viewerId) {
      whereCondition.NOT = {
        deletedForUserIds: { has: viewerId },
      };
    }

    const messages = await this.prisma.directMessage.findMany({
      where: whereCondition,
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
    // Also mark messages where senderId !== userId as isRead: true
    await this.prisma.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async deleteMessage(messageId: string, userId: string, scope: 'FOR_ME' | 'FOR_EVERYONE'): Promise<void> {
    const message = await this.prisma.directMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) {
      throw new Error("Message not found");
    }

    if (scope === 'FOR_EVERYONE') {
      if (message.senderId !== userId) {
        throw new Error("Unauthorized: Only the sender can delete a message for everyone");
      }
      if (message.isRead) {
        throw new Error("Cannot delete for everyone: Message has already been read");
      }
      await this.prisma.directMessage.delete({
        where: { id: messageId },
      });
      return;
    }

    // scope === 'FOR_ME': append userId to deletedForUserIds
    if (!message.deletedForUserIds.includes(userId)) {
      await this.prisma.directMessage.update({
        where: { id: messageId },
        data: {
          deletedForUserIds: {
            push: userId,
          },
        },
      });
    }
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    // ModelLink pattern: Mark isHidden: true and set clearedAt: NOW()
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: {
        isHidden: true,
        clearedAt: new Date(),
      },
    });

    // Check if ALL participants have hidden the conversation
    const activeParticipants = await this.prisma.conversationParticipant.count({
      where: {
        conversationId,
        isHidden: false,
      },
    });

    // If no active participants remain, completely teardown the room
    if (activeParticipants === 0) {
      await this.prisma.conversation.delete({
        where: { id: conversationId },
      });
    }
  }
}
