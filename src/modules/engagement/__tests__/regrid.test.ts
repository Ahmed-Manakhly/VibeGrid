import { ToggleReGridUseCase } from '../application/ToggleReGrid.usecase';
import { Result, success } from '@/shared/kernel/Result';

describe('Engagement Domain — Re-Grid Use Case Tests', () => {
  let mockEngagementRepo: any;
  let mockEventBus: any;
  let useCase: ToggleReGridUseCase;

  beforeEach(() => {
    mockEngagementRepo = {
      toggleReGrid: jest.fn(),
    };
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };
    useCase = new ToggleReGridUseCase(mockEngagementRepo, mockEventBus);
  });

  it('should create a Re-Grid record and publish ReGridCreatedEvent on first amplification', async () => {
    mockEngagementRepo.toggleReGrid.mockResolvedValue(
      success({ isReGridded: true, authorId: 'author_user_99', regrid: { id: 'regrid_1' } })
    );

    const res = await useCase.execute('vibe_post_100', 'user_regridder_01');

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.value.isReGridded).toBe(true);
    }
    expect(mockEngagementRepo.toggleReGrid).toHaveBeenCalledWith('vibe_post_100', 'user_regridder_01');
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'ReGridCreatedEvent',
      expect.objectContaining({
        vibeId: 'vibe_post_100',
        regridderId: 'user_regridder_01',
        authorId: 'author_user_99',
      })
    );
  });

  it('should remove Re-Grid record and NOT publish event on un-regrid toggle', async () => {
    mockEngagementRepo.toggleReGrid.mockResolvedValue(
      success({ isReGridded: false, authorId: 'author_user_99' })
    );

    const res = await useCase.execute('vibe_post_100', 'user_regridder_01');

    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.value.isReGridded).toBe(false);
    }
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
