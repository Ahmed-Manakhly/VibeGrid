import { SearchUsersUseCase } from '../application/SearchUsers.usecase';
import { GenerateFeedUseCase } from '../../vibe/application/GenerateFeed.usecase';
import { Result, success } from '@/shared/kernel/Result';

describe('Discovery / Search Domain Tests', () => {
  let mockSocialRepo: any;
  let mockVibeRepo: any;

  beforeEach(() => {
    mockSocialRepo = {
      searchUsers: jest.fn(),
    };
    mockVibeRepo = {
      getFeed: jest.fn(),
    };
  });

  describe('SearchUsersUseCase', () => {
    it('should return empty array when search query is empty or whitespace', async () => {
      const useCase = new SearchUsersUseCase(mockSocialRepo);
      const res1 = await useCase.execute('');
      const res2 = await useCase.execute('   ');

      expect(res1).toEqual([]);
      expect(res2).toEqual([]);
      expect(mockSocialRepo.searchUsers).not.toHaveBeenCalled();
    });

    it('should call repository with trimmed search query', async () => {
      const mockUsers = [
        { id: 'usr_1', username: 'alex_dev', name: 'Alex Developer' },
      ];
      mockSocialRepo.searchUsers.mockResolvedValue(mockUsers);

      const useCase = new SearchUsersUseCase(mockSocialRepo);
      const res = await useCase.execute('  alex  ', 5);

      expect(res).toEqual(mockUsers);
      expect(mockSocialRepo.searchUsers).toHaveBeenCalledWith('alex', 5);
    });
  });

  describe('GenerateFeedUseCase Search Integration', () => {
    it('should pass search parameter to Vibe repository feed query', async () => {
      const mockFeedResult = {
        data: [{ id: 'post_1', content: 'Building full text search' }],
        nextCursor: null,
      };
      mockVibeRepo.getFeed.mockResolvedValue(mockFeedResult);

      const useCase = new GenerateFeedUseCase(mockVibeRepo);
      const res = await useCase.execute({ search: 'search' });

      expect(res).toEqual(mockFeedResult);
      expect(mockVibeRepo.getFeed).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'search' })
      );
    });
  });
});
