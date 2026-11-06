import { TrendingShipsScorer } from '../domain/TrendingShipsScorer';

describe('TrendingShipsScorer Domain Service', () => {
  it('calculates ship score with weighted points and time decay', () => {
    const recent = new Date(Date.now() - 3600000); // 1 hour ago
    const older = new Date(Date.now() - 86400000); // 24 hours ago

    const scoreRecent = TrendingShipsScorer.calculateShipScore(10, 5, 4, recent);
    const scoreOlder = TrendingShipsScorer.calculateShipScore(10, 5, 4, older);

    expect(scoreRecent).toBeGreaterThan(scoreOlder);
    expect(scoreRecent).toBeGreaterThan(0);
  });

  it('ranks ship posts by score descending and ignores posts without project names', () => {
    const now = new Date();
    const mockPosts = [
      {
        id: 'post_older_few_upvotes',
        createdAt: new Date(Date.now() - 48 * 3600000),
        techContext: {
          projectName: 'Old Tool',
          tagline: 'Legacy CLI',
          techStack: ['Go'],
        },
        author: { id: 'u1', name: 'Alice', username: 'alice', image: null },
        _count: { likes: 2, bookmarks: 1, comments: 0 },
      },
      {
        id: 'post_fresh_viral',
        createdAt: new Date(Date.now() - 2 * 3600000),
        techContext: {
          projectName: 'VibeGrid AI',
          tagline: 'Autonomous AI Engine',
          techStack: ['Next.js', 'Redis', 'Postgres'],
        },
        author: { id: 'u2', name: 'Bob', username: 'bob', image: null },
        _count: { likes: 30, bookmarks: 15, comments: 10 },
      },
      {
        id: 'post_no_ship_context',
        createdAt: now,
        techContext: null,
        author: { id: 'u3', name: 'Carol', username: 'carol', image: null },
        _count: { likes: 100 },
      },
    ];

    const ranked = TrendingShipsScorer.rankShipPosts(mockPosts);

    expect(ranked.length).toBe(2);
    expect(ranked[0].projectName).toBe('VibeGrid AI');
    expect(ranked[0].upvotesCount).toBe(30);
    expect(ranked[0].techStack).toEqual(['Next.js', 'Redis', 'Postgres']);
    expect(ranked[1].projectName).toBe('Old Tool');
  });
});
