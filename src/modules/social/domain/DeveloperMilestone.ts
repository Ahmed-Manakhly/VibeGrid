export type MilestoneCategory =
  | 'RELEASE'
  | 'OPEN_SOURCE'
  | 'PROMOTION'
  | 'AWARD'
  | 'EDUCATION'
  | 'OTHER';

export interface DeveloperMilestoneProps {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  category: MilestoneCategory;
  icon?: string | null;
  linkUrl?: string | null;
  achievedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class DeveloperMilestone {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly description: string | null;
  readonly category: MilestoneCategory;
  readonly icon: string | null;
  readonly linkUrl: string | null;
  readonly achievedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: DeveloperMilestoneProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('Milestone title cannot be empty.');
    }
    if (props.title.length > 120) {
      throw new Error('Milestone title cannot exceed 120 characters.');
    }
    if (props.description && props.description.length > 500) {
      throw new Error('Milestone description cannot exceed 500 characters.');
    }
    if (!props.achievedAt || isNaN(props.achievedAt.getTime())) {
      throw new Error('Valid achievement date is required.');
    }

    this.id = props.id;
    this.userId = props.userId;
    this.title = props.title.trim();
    this.description = props.description?.trim() || null;
    this.category = props.category;
    this.icon = props.icon || null;
    this.linkUrl = props.linkUrl?.trim() || null;
    this.achievedAt = props.achievedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
