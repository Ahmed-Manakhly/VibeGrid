import { FeedRecommendationScorer } from '../domain/FeedRecommendationScorer';
import { GenerateFeedUseCase } from '../application/GenerateFeed.usecase';
import { VibePost } from '../domain/IVibeRepository';

describe('Recommendation Engine V1 — Domain & Application Scoring Tests', () => {
  let scorer: FeedRecommendationScorer;

  const samplePosts: VibePost[] = [
    {
      id: 'post_old_unrelated',
      content: 'Old post about generic topic',
      mediaUrl: null,
      mediaType: null,
      tags: [],
      author: { id: 'author_1', username: 'author_1', image: null, name: 'Author One' },
      category: { id: 'cat_generic', name: 'General', slug: 'general', emoji: '⚙️' },
      likes: [],
      comments: [],
      _count: { likes: 2, comments: 1, bookmarks: 0, regrids: 0 },
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 3 days old
    },
    {
      id: 'post_new_followed',
      content: 'Fresh post from a followed developer',
      mediaUrl: null,
      mediaType: null,
      tags: [],
      author: { id: 'author_followed', username: 'followed_dev', image: null, name: 'Followed Dev' },
      category: { id: 'cat_generic', name: 'General', slug: 'general', emoji: '⚙️' },
      likes: [],
      comments: [],
      _count: { likes: 5, comments: 2, bookmarks: 1, regrids: 1 },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours old
    },
    {
      id: 'post_new_interested_category',
      content: 'Fresh post matching user interest category',
      mediaUrl: null,
      mediaType: null,
      tags: [],
      author: { id: 'author_2', username: 'author_2', image: null, name: 'Author Two' },
      category: { id: 'cat_react', name: 'React', slug: 'react', emoji: '⚛️' },
      likes: [],
      comments: [],
      _count: { likes: 10, comments: 4, bookmarks: 2, regrids: 2 },
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour old
    },
  ];

  beforeEach(() => {
    scorer = new FeedRecommendationScorer();
  });

  describe('FeedRecommendationScorer Domain Unit Tests', () => {
    it('should boost posts authored by followed users by +35 points', () => {
      const context = {
        followedAuthorIds: new Set(['author_followed']),
      };

      const scoreFollowed = scorer.scorePost(samplePosts[1], context);
      const scoreUnfollowed = scorer.scorePost(samplePosts[1], {});

      expect(scoreFollowed - scoreUnfollowed).toBeCloseTo(35, 1);
    });

    it('should boost posts matching user interested category by +25 points', () => {
      const context = {
        userInterestedCategoryIds: new Set(['cat_react']),
      };

      const scoreInterested = scorer.scorePost(samplePosts[2], context);
      const scoreUninterested = scorer.scorePost(samplePosts[2], {});

      expect(scoreInterested - scoreUninterested).toBeCloseTo(25, 1);
    });

    it('should rank posts deterministically with relationship and relevance signals leading', () => {
      const context = {
        followedAuthorIds: new Set(['author_followed']),
        userInterestedCategoryIds: new Set(['cat_react']),
      };

      const ranked = scorer.rankPosts([...samplePosts], context);

      expect(ranked[0].id).toBe('post_new_interested_category'); // 1 hour old (most recent chronologically)
      expect(ranked[1].id).toBe('post_new_followed');            // 2 hours old
      expect(ranked[2].id).toBe('post_old_unrelated');           // 72 hours old
    });

    it('should boost dilemma polls and project ships with technical bonus of +15 points', () => {
      const pollPost: VibePost = {
        ...samplePosts[0],
        id: 'post_poll',
        poll: { question: 'Tabs vs Spaces?', options: [] } as any,
        postType: 'DILEMMA_POLL',
      };
      const shipPost: VibePost = {
        ...samplePosts[0],
        id: 'post_ship',
        techContext: { isShip: true, projectName: 'NextForge' } as any,
        postType: 'PROJECT_SHIP',
      };

      const baseScore = scorer.scorePost(samplePosts[0], {});
      const pollScore = scorer.scorePost(pollPost, {});
      const shipScore = scorer.scorePost(shipPost, {});

      expect(pollScore - baseScore).toBeCloseTo(15, 1);
      expect(shipScore - baseScore).toBeCloseTo(15, 1);
    });

    it('should fallback gracefully to fresh/engagement ranking for unauthenticated users', () => {
      const ranked = scorer.rankPosts([...samplePosts], {});

      expect(ranked.length).toBe(3);
      expect(ranked[0].id).toBe('post_new_interested_category'); // Highest freshness + engagement
      expect(ranked[2].id).toBe('post_old_unrelated');
    });
  });

  describe('GenerateFeedUseCase Integration with Scorer', () => {
    it('should execute feed recommendation ranking smoothly without throwing', async () => {
      const mockRepo: any = {
        getFeed: jest.fn().mockResolvedValue({
          data: samplePosts,
          nextCursor: null,
        }),
      };
      const mockSocialRepo: any = {
        getFollowingIds: jest.fn().mockResolvedValue(['author_followed']),
      };
      const mockUserInterestRepo: any = {
        getUserInterests: jest.fn().mockResolvedValue([{ id: 'cat_react' }]),
      };

      const useCase = new GenerateFeedUseCase(mockRepo, undefined, mockSocialRepo, mockUserInterestRepo);

      const result = await useCase.execute({ userId: 'user_active' });

      expect(result.data.length).toBe(3);
      expect(mockSocialRepo.getFollowingIds).toHaveBeenCalledWith('user_active');
      expect(mockUserInterestRepo.getUserInterests).toHaveBeenCalledWith('user_active');
      expect(result.data[0].id).toBe('post_new_interested_category');
    });
  });
});
