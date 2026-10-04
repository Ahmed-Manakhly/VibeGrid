import { PrismaMessagingRepository } from '../infrastructure/PrismaMessagingRepository';
import { StartConversationUseCase } from '../application/StartConversation.usecase';
import { SendMessageUseCase } from '../application/SendMessage.usecase';
import { GetMessagesUseCase, GetConversationsUseCase } from '../application/GetMessages.usecase';

describe('Messaging Module Integration & Authorization', () => {
  let mockPrisma: any;
  let messagingRepo: PrismaMessagingRepository;

  beforeEach(() => {
    mockPrisma = {
      conversation: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      conversationParticipant: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      directMessage: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    messagingRepo = new PrismaMessagingRepository(mockPrisma);
  });

  describe('StartConversationUseCase', () => {
    it('should reject starting a conversation with oneself', async () => {
      const usecase = new StartConversationUseCase(messagingRepo);
      await expect(usecase.execute('user_1', 'user_1')).rejects.toThrow('Cannot start a conversation with yourself');
    });

    it('should reuse existing direct conversation if one already exists', async () => {
      const existingConv = {
        id: 'conv_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [
          { conversationId: 'conv_123', userId: 'user_1', user: { id: 'user_1', username: 'u1' } },
          { conversationId: 'conv_123', userId: 'user_2', user: { id: 'user_2', username: 'u2' } },
        ],
        messages: [],
      };
      mockPrisma.conversation.findFirst.mockResolvedValue(existingConv);

      const usecase = new StartConversationUseCase(messagingRepo);
      const res = await usecase.execute('user_1', 'user_2');

      expect(res.id).toBe('conv_123');
      expect(mockPrisma.conversation.create).not.toHaveBeenCalled();
    });
  });

  describe('SendMessageUseCase Authorization & Invariants', () => {
    it('should reject empty message content', async () => {
      const usecase = new SendMessageUseCase(messagingRepo);
      await expect(
        usecase.execute({ senderId: 'user_1', conversationId: 'conv_1', content: '   ' })
      ).rejects.toThrow('Message content cannot be empty');
    });

    it('should reject message if sender is not a participant', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue(null);

      const usecase = new SendMessageUseCase(messagingRepo);
      await expect(
        usecase.execute({ senderId: 'unauthorized_user', conversationId: 'conv_1', content: 'Hello' })
      ).rejects.toThrow('Unauthorized: Sender is not a participant in this conversation');
    });

    it('should successfully save message and publish event if sender is authorized', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv_1',
        userId: 'user_1',
      });

      const savedMessage = {
        id: 'msg_99',
        conversationId: 'conv_1',
        senderId: 'user_1',
        content: 'Hello World',
        createdAt: new Date(),
        sender: { id: 'user_1', username: 'u1', name: 'User 1', image: null },
      };
      mockPrisma.directMessage.create.mockResolvedValue(savedMessage);

      const mockCache = { publish: jest.fn().mockResolvedValue(1) };
      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv_1',
        participants: [{ userId: 'user_1' }, { userId: 'user_2' }],
        messages: [],
      });

      const usecase = new SendMessageUseCase(messagingRepo, mockCache as any);
      const res = await usecase.execute({ senderId: 'user_1', conversationId: 'conv_1', content: 'Hello World' });

      expect(res.id).toBe('msg_99');
      expect(res.content).toBe('Hello World');
      expect(mockCache.publish).toHaveBeenCalledWith(
        'realtime:direct_message',
        expect.stringContaining('Hello World')
      );
    });
  });

  describe('GetMessagesUseCase Authorization', () => {
    it('should reject fetching messages if user is not a participant', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue(null);

      const usecase = new GetMessagesUseCase(messagingRepo);
      await expect(usecase.execute('conv_1', 'unauthorized_user')).rejects.toThrow(
        'Unauthorized: You are not a participant in this conversation'
      );
    });
  });
});
