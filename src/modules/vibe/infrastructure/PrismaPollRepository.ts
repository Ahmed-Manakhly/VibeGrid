import { PrismaClient } from '@prisma/client';
import {
  CastVoteInput,
  CreatePollInput,
  IPollRepository,
  PollTallies,
} from '../domain/IPollRepository';
import { Poll } from '../domain/Poll';

export class PrismaPollRepository implements IPollRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createPoll(input: CreatePollInput): Promise<Poll> {
    const expiresAt = new Date(Date.now() + input.durationHours * 60 * 60 * 1000);

    const record = await this.prisma.poll.create({
      data: {
        postId: input.postId,
        question: input.question.trim(),
        expiresAt,
        options: {
          create: input.options.map((opt, idx) => ({
            text: opt.trim(),
            index: idx,
          })),
        },
      },
      include: {
        options: {
          orderBy: { index: 'asc' },
        },
      },
    });

    return new Poll({
      id: record.id,
      postId: record.postId,
      question: record.question,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      options: record.options.map((o) => ({
        id: o.id,
        pollId: o.pollId,
        text: o.text,
        index: o.index,
        votesCount: 0,
      })),
      totalVotes: 0,
      userVotedOptionId: null,
    });
  }

  async findByPostId(postId: string, userId?: string | null): Promise<Poll | null> {
    const record = await this.prisma.poll.findUnique({
      where: { postId },
      include: {
        options: {
          orderBy: { index: 'asc' },
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        votes: userId ? { where: { userId } } : false,
      },
    });

    if (!record) return null;

    const userVotedOptionId =
      userId && record.votes && record.votes.length > 0
        ? record.votes[0].optionId
        : null;

    const totalVotes = record.options.reduce(
      (sum, opt) => sum + (opt as any)._count.votes,
      0
    );

    return new Poll({
      id: record.id,
      postId: record.postId,
      question: record.question,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      options: record.options.map((o) => ({
        id: o.id,
        pollId: o.pollId,
        text: o.text,
        index: o.index,
        votesCount: (o as any)._count.votes,
      })),
      totalVotes,
      userVotedOptionId,
    });
  }

  async findById(pollId: string, userId?: string | null): Promise<Poll | null> {
    const record = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { index: 'asc' },
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        votes: userId ? { where: { userId } } : false,
      },
    });

    if (!record) return null;

    const userVotedOptionId =
      userId && record.votes && record.votes.length > 0
        ? record.votes[0].optionId
        : null;

    const totalVotes = record.options.reduce(
      (sum, opt) => sum + (opt as any)._count.votes,
      0
    );

    return new Poll({
      id: record.id,
      postId: record.postId,
      question: record.question,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      options: record.options.map((o) => ({
        id: o.id,
        pollId: o.pollId,
        text: o.text,
        index: o.index,
        votesCount: (o as any)._count.votes,
      })),
      totalVotes,
      userVotedOptionId,
    });
  }

  async castVote(input: CastVoteInput): Promise<{ success: boolean; tallies: PollTallies }> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: input.pollId },
      select: { expiresAt: true },
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    if (new Date() > poll.expiresAt) {
      throw new Error('This poll has expired and voting is closed.');
    }

    // Atomic create vote; duplicate vote triggers unique constraint [pollId, userId]
    await this.prisma.pollVote.create({
      data: {
        pollId: input.pollId,
        optionId: input.optionId,
        userId: input.userId,
      },
    });

    const tallies = await this.getTallies(input.pollId, input.userId);
    if (!tallies) throw new Error('Failed to compute tallies');

    return { success: true, tallies };
  }

  async getTallies(pollId: string, userId?: string | null): Promise<PollTallies | null> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { index: 'asc' },
          include: {
            _count: {
              select: { votes: true },
            },
          },
        },
        votes: userId ? { where: { userId } } : false,
      },
    });

    if (!poll) return null;

    const totalVotes = poll.options.reduce(
      (sum, o) => sum + (o as any)._count.votes,
      0
    );

    const userVotedOptionId =
      userId && poll.votes && poll.votes.length > 0
        ? poll.votes[0].optionId
        : null;

    const isExpired = new Date() > poll.expiresAt;

    return {
      pollId: poll.id,
      totalVotes,
      options: poll.options.map((o) => {
        const count = (o as any)._count.votes;
        const percentage =
          totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return {
          id: o.id,
          text: o.text,
          index: o.index,
          votesCount: count,
          percentage,
        };
      }),
      userVotedOptionId,
      isExpired,
      expiresAt: poll.expiresAt.toISOString(),
    };
  }
}
