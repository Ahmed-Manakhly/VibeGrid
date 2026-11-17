import { PrismaTrustSafetyRepository } from '../infrastructure/PrismaTrustSafetyRepository';
import { BlockUserUseCase, UnblockUserUseCase, CreateReportUseCase } from '../application/TrustSafetyUseCases';
import { StartConversationUseCase } from '@/modules/messaging/application/StartConversation.usecase';
import { SendMessageUseCase } from '@/modules/messaging/application/SendMessage.usecase';

describe('Trust & Safety Module Integration & Messaging Restrictions', () => {
  let mockPrisma: any;
  let safetyRepo: PrismaTrustSafetyRepository;
  let mockMessagingRepo: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn(async (cb: any) => cb(mockPrisma)),
      userBlock: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      follows: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      community: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      communityMember: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      conversation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      conversationParticipant: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      userReport: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    mockMessagingRepo = {
      findOrCreateDirectConversation: jest.fn(),
      isParticipant: jest.fn(),
      saveMessage: jest.fn(),
      getConversationById: jest.fn(),
    };

    safetyRepo = new PrismaTrustSafetyRepository(mockPrisma);
  });

  describe('BlockUserUseCase Invariants', () => {
    it('should reject blocking oneself', async () => {
      const usecase = new BlockUserUseCase(safetyRepo);
      await expect(usecase.execute('user_1', 'user_1')).rejects.toThrow('You cannot block yourself');
    });

    it('should upsert block record in database', async () => {
      mockPrisma.userBlock.upsert.mockResolvedValue({});
      const usecase = new BlockUserUseCase(safetyRepo);
      await usecase.execute('user_1', 'user_2');

      expect(mockPrisma.userBlock.upsert).toHaveBeenCalledWith({
        where: { blockerId_blockedId: { blockerId: 'user_1', blockedId: 'user_2' } },
        create: { blockerId: 'user_1', blockedId: 'user_2' },
        update: {},
      });
    });
  });

  describe('UnblockUserUseCase', () => {
    it('should delete block record', async () => {
      mockPrisma.userBlock.deleteMany.mockResolvedValue({ count: 1 });
      const usecase = new UnblockUserUseCase(safetyRepo);
      await usecase.execute('user_1', 'user_2');

      expect(mockPrisma.userBlock.deleteMany).toHaveBeenCalledWith({
        where: { blockerId: 'user_1', blockedId: 'user_2' },
      });
    });
  });

  describe('Direct Messaging Block Enforcement Integration', () => {
    it('should prevent starting a conversation with a blocked user', async () => {
      mockPrisma.userBlock.findFirst.mockResolvedValue({ blockerId: 'user_1', blockedId: 'user_2' });

      const startConvUseCase = new StartConversationUseCase(mockMessagingRepo, safetyRepo);
      await expect(startConvUseCase.execute('user_1', 'user_2')).rejects.toThrow(
        'Cannot start a conversation with a blocked user'
      );
    });

    it('should prevent sending a message if user is blocked in either direction', async () => {
      mockMessagingRepo.isParticipant.mockResolvedValue(true);
      mockMessagingRepo.getConversationById.mockResolvedValue({
        id: 'conv_1',
        participants: [
          { userId: 'user_1' },
          { userId: 'user_2' },
        ],
      });
      // User B blocked User A
      mockPrisma.userBlock.findFirst.mockResolvedValue({ blockerId: 'user_2', blockedId: 'user_1' });

      const sendMessageUseCase = new SendMessageUseCase(mockMessagingRepo, undefined, safetyRepo);
      await expect(
        sendMessageUseCase.execute({ senderId: 'user_1', conversationId: 'conv_1', content: 'Hello' })
      ).rejects.toThrow('Cannot send message to a blocked user');

      expect(mockMessagingRepo.saveMessage).not.toHaveBeenCalled();
    });
  });

  describe('CreateReportUseCase', () => {
    it('should successfully submit a user report', async () => {
      const mockReport = {
        id: 'rep_1',
        reporterId: 'user_1',
        targetType: 'POST',
        targetId: 'post_100',
        reason: 'spam',
        description: 'Spam post',
        createdAt: new Date(),
      };
      mockPrisma.userReport.create.mockResolvedValue(mockReport);

      const usecase = new CreateReportUseCase(safetyRepo);
      const res = await usecase.execute({
        reporterId: 'user_1',
        targetType: 'POST',
        targetId: 'post_100',
        reason: 'spam',
        description: 'Spam post',
      });

      expect(res.id).toBe('rep_1');
      expect(res.targetType).toBe('POST');
    });
  });
});
