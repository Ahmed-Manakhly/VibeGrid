import { DeveloperMilestone, MilestoneCategory } from './DeveloperMilestone';

export interface CreateMilestoneInput {
  userId: string;
  title: string;
  description?: string | null;
  category: MilestoneCategory;
  icon?: string | null;
  linkUrl?: string | null;
  achievedAt: Date;
}

export interface IMilestoneRepository {
  findByUserId(userId: string): Promise<DeveloperMilestone[]>;
  findById(id: string): Promise<DeveloperMilestone | null>;
  create(input: CreateMilestoneInput): Promise<DeveloperMilestone>;
  delete(id: string, userId: string): Promise<boolean>;
}
