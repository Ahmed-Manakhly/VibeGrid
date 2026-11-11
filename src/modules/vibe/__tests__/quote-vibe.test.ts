import { CreateVibeUseCase } from '../application/CreateVibe.usecase';
import { IVibeRepository } from '../domain/IVibeRepository';
import { IEventBus } from '@/shared/domain/events/IEventBus';
import { success } from '@/shared/kernel/Result';

describe('CreateVibeUseCase - Quote Vibes', () => {
  let useCase: CreateVibeUseCase;
  let mockVibeRepo: jest.Mocked<IVibeRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockVibeRepo = {
      create: jest.fn(),
      getFeed: jest.fn(),
      getPostById: jest.fn(),
      getPostsByIds: jest.fn(),
      deletePost: jest.fn(),
      getTrendingShips: jest.fn(),
    };

    mockEventBus = {
      publish: jest.fn(),
      subscribe: jest.fn(),
    };

    useCase = new CreateVibeUseCase(mockVibeRepo, mockEventBus);
  });

  it('should successfully create a quote vibe referencing an existing target post', async () => {
    mockVibeRepo.getPostById.mockResolvedValue({
      id: 'target_post_123',
      content: 'Original post content',
      authorId: 'author_original',
    });

    mockVibeRepo.create.mockResolvedValue(
      success({
        id: 'quote_post_456',
        content: 'Check out this awesome architecture!',
        authorId: 'quoter_789',
        quotedPostId: 'target_post_123',
      })
    );

    const result = await useCase.execute(
      'Check out this awesome architecture!',
      undefined,
      undefined,
      'quoter_789',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'target_post_123'
    );

    expect(result.success).toBe(true);
    expect(mockVibeRepo.getPostById).toHaveBeenCalledWith('target_post_123');
    expect(mockVibeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Check out this awesome architecture!',
        authorId: 'quoter_789',
        quotedPostId: 'target_post_123',
      })
    );
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'VibeCreatedEvent',
      expect.objectContaining({
        vibeId: 'quote_post_456',
        authorId: 'quoter_789',
        quotedPostId: 'target_post_123',
      })
    );
  });

  it('should fail with error if target quoted post does not exist', async () => {
    mockVibeRepo.getPostById.mockResolvedValue(null);

    const result = await useCase.execute(
      'Quoting a deleted post',
      undefined,
      undefined,
      'quoter_789',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'non_existent_id'
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('The vibe you are trying to quote does not exist.');
    }
    expect(mockVibeRepo.create).not.toHaveBeenCalled();
  });
});
