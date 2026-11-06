import { Poll } from '../domain/Poll';
import { PrismaPollRepository } from '../infrastructure/PrismaPollRepository';

describe('Poll Domain Entity', () => {
  it('instantiates valid Poll with 2 to 4 options', () => {
    const now = new Date();
    const expiresAt = new Date(Date.now() + 86400000);
    const poll = new Poll({
      id: 'p1',
      postId: 'post_1',
      question: 'PostgreSQL or SQLite for embedded MVPs?',
      expiresAt,
      createdAt: now,
      updatedAt: now,
      options: [
        { id: 'opt_1', pollId: 'p1', text: 'PostgreSQL', index: 0, votesCount: 10 },
        { id: 'opt_2', pollId: 'p1', text: 'SQLite', index: 1, votesCount: 5 },
      ],
      totalVotes: 15,
    });

    expect(poll.question).toBe('PostgreSQL or SQLite for embedded MVPs?');
    expect(poll.options.length).toBe(2);
    expect(poll.isExpired()).toBe(false);
  });

  it('rejects poll with less than 2 options', () => {
    expect(() => {
      new Poll({
        id: 'p2',
        postId: 'post_2',
        question: 'Single option question?',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [{ id: 'opt_1', pollId: 'p2', text: 'Only one', index: 0 }],
      });
    }).toThrow('A dilemma poll must have at least 2 options.');
  });

  it('rejects poll with more than 4 options', () => {
    expect(() => {
      new Poll({
        id: 'p3',
        postId: 'post_3',
        question: 'Too many options?',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        options: [
          { id: '1', pollId: 'p3', text: 'Opt 1', index: 0 },
          { id: '2', pollId: 'p3', text: 'Opt 2', index: 1 },
          { id: '3', pollId: 'p3', text: 'Opt 3', index: 2 },
          { id: '4', pollId: 'p3', text: 'Opt 4', index: 3 },
          { id: '5', pollId: 'p3', text: 'Opt 5', index: 4 },
        ],
      });
    }).toThrow('A dilemma poll cannot have more than 4 options.');
  });
});

describe('PrismaPollRepository', () => {
  it('creates a poll with options correctly', async () => {
    const mockPrisma: any = {
      poll: {
        create: jest.fn().mockResolvedValue({
          id: 'poll_123',
          postId: 'post_123',
          question: 'Bun vs Node 22?',
          expiresAt: new Date(Date.now() + 86400000),
          createdAt: new Date(),
          updatedAt: new Date(),
          options: [
            { id: 'opt_1', pollId: 'poll_123', text: 'Bun', index: 0 },
            { id: 'opt_2', pollId: 'poll_123', text: 'Node 22', index: 1 },
          ],
        }),
      },
    };

    const repo = new PrismaPollRepository(mockPrisma);
    const result = await repo.createPoll({
      postId: 'post_123',
      question: 'Bun vs Node 22?',
      options: ['Bun', 'Node 22'],
      durationHours: 24,
    });

    expect(mockPrisma.poll.create).toHaveBeenCalled();
    expect(result.id).toBe('poll_123');
    expect(result.options.length).toBe(2);
  });

  it('rejects vote on expired poll', async () => {
    const mockPrisma: any = {
      poll: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'poll_expired',
          expiresAt: new Date(Date.now() - 10000), // Expired in the past
        }),
      },
    };

    const repo = new PrismaPollRepository(mockPrisma);
    await expect(
      repo.castVote({ pollId: 'poll_expired', optionId: 'opt_1', userId: 'user_1' })
    ).rejects.toThrow('This poll has expired and voting is closed.');
  });

  it('casts vote and returns computed tallies with percentages', async () => {
    const mockPrisma: any = {
      poll: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'poll_live',
            expiresAt: new Date(Date.now() + 86400000),
          })
          .mockResolvedValueOnce({
            id: 'poll_live',
            expiresAt: new Date(Date.now() + 86400000),
            options: [
              { id: 'opt_1', text: 'Bun', index: 0, _count: { votes: 3 } },
              { id: 'opt_2', text: 'Node 22', index: 1, _count: { votes: 1 } },
            ],
            votes: [{ optionId: 'opt_1' }],
          }),
      },
      pollVote: {
        create: jest.fn().mockResolvedValue({ id: 'vote_1' }),
      },
    };

    const repo = new PrismaPollRepository(mockPrisma);
    const res = await repo.castVote({
      pollId: 'poll_live',
      optionId: 'opt_1',
      userId: 'user_1',
    });

    expect(res.success).toBe(true);
    expect(res.tallies.totalVotes).toBe(4);
    expect(res.tallies.options[0].percentage).toBe(75);
    expect(res.tallies.options[1].percentage).toBe(25);
    expect(res.tallies.userVotedOptionId).toBe('opt_1');
  });
});
