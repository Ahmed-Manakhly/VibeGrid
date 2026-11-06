import { Poll } from './Poll';

export interface CreatePollInput {
  postId: string;
  question: string;
  options: string[];
  durationHours: number; // e.g. 24, 72, 168
}

export interface CastVoteInput {
  pollId: string;
  optionId: string;
  userId: string;
}

export interface PollTallies {
  pollId: string;
  totalVotes: number;
  options: Array<{
    id: string;
    text: string;
    index: number;
    votesCount: number;
    percentage: number;
  }>;
  userVotedOptionId?: string | null;
  isExpired: boolean;
  expiresAt: string;
}

export interface IPollRepository {
  createPoll(input: CreatePollInput): Promise<Poll>;
  findByPostId(postId: string, userId?: string | null): Promise<Poll | null>;
  findById(pollId: string, userId?: string | null): Promise<Poll | null>;
  castVote(input: CastVoteInput): Promise<{ success: boolean; tallies: PollTallies }>;
  getTallies(pollId: string, userId?: string | null): Promise<PollTallies | null>;
}
