export interface PollOptionProps {
  id: string;
  pollId: string;
  text: string;
  index: number;
  votesCount?: number;
}

export interface PollProps {
  id: string;
  postId: string;
  question: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  options: PollOptionProps[];
  totalVotes?: number;
  userVotedOptionId?: string | null;
}

export class Poll {
  readonly id: string;
  readonly postId: string;
  readonly question: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly options: PollOptionProps[];
  readonly totalVotes: number;
  readonly userVotedOptionId: string | null;

  constructor(props: PollProps) {
    if (!props.question || props.question.trim().length === 0) {
      throw new Error('Poll question cannot be empty.');
    }
    if (props.question.length > 200) {
      throw new Error('Poll question cannot exceed 200 characters.');
    }
    if (!props.options || props.options.length < 2) {
      throw new Error('A dilemma poll must have at least 2 options.');
    }
    if (props.options.length > 4) {
      throw new Error('A dilemma poll cannot have more than 4 options.');
    }

    this.id = props.id;
    this.postId = props.postId;
    this.question = props.question.trim();
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.options = props.options;
    this.totalVotes = props.totalVotes ?? 0;
    this.userVotedOptionId = props.userVotedOptionId ?? null;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
