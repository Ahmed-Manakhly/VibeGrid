import { ToggleBookmarkUseCase } from '../application/ToggleBookmark.usecase';
import { AddCommentUseCase } from '../application/AddComment.usecase';
import { success } from '@/shared/kernel/Result';

describe('Engagement Domain — Social Completion (Bookmarks & Replies) Tests', () => {
  let mockEngagementRepo: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockEngagementRepo = {
      toggleBookmark: jest.fn(),
      addComment: jest.fn(),
    };
    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };
  });

  describe('ToggleBookmarkUseCase', () => {
    it('should toggle bookmark on and return isBookmarked: true', async () => {
      mockEngagementRepo.toggleBookmark.mockResolvedValue(
        success({ isBookmarked: true, authorId: 'author_user_1' })
      );

      const useCase = new ToggleBookmarkUseCase(mockEngagementRepo, mockEventBus);
      const res = await useCase.execute('vibe_post_1', 'user_1');

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.value.isBookmarked).toBe(true);
      }
      expect(mockEngagementRepo.toggleBookmark).toHaveBeenCalledWith('vibe_post_1', 'user_1');
    });

    it('should toggle bookmark off and return isBookmarked: false', async () => {
      mockEngagementRepo.toggleBookmark.mockResolvedValue(
        success({ isBookmarked: false, authorId: 'author_user_1' })
      );

      const useCase = new ToggleBookmarkUseCase(mockEngagementRepo, mockEventBus);
      const res = await useCase.execute('vibe_post_1', 'user_1');

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.value.isBookmarked).toBe(false);
      }
    });
  });

  describe('AddCommentUseCase with parentId (Replies)', () => {
    it('should add a threaded reply to a parent comment', async () => {
      mockEngagementRepo.addComment.mockResolvedValue(
        success({ commentId: 'reply_comment_1', authorId: 'author_user_1', comment: { id: 'reply_comment_1', parentId: 'parent_comment_99' } })
      );

      const useCase = new AddCommentUseCase(mockEngagementRepo, mockEventBus);
      const res = await useCase.execute('vibe_post_1', 'user_2', 'This is a reply', 'parent_comment_99');

      expect(res.success).toBe(true);
      expect(mockEngagementRepo.addComment).toHaveBeenCalledWith('vibe_post_1', 'user_2', 'This is a reply', 'parent_comment_99');
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'CommentAddedEvent',
        expect.objectContaining({
          vibeId: 'vibe_post_1',
          commentId: 'reply_comment_1',
          commenterId: 'user_2',
        })
      );
    });
  });
});
