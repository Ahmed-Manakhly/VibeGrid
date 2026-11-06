import { PrismaClient } from '@prisma/client';
import {
  CreateMilestoneInput,
  IMilestoneRepository,
} from '../domain/IMilestoneRepository';
import { DeveloperMilestone, MilestoneCategory } from '../domain/DeveloperMilestone';

export class PrismaMilestoneRepository implements IMilestoneRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<DeveloperMilestone[]> {
    const records = await this.prisma.developerMilestone.findMany({
      where: { userId },
      orderBy: { achievedAt: 'desc' },
    });

    return records.map(
      (r) =>
        new DeveloperMilestone({
          id: r.id,
          userId: r.userId,
          title: r.title,
          description: r.description,
          category: r.category as MilestoneCategory,
          icon: r.icon,
          linkUrl: r.linkUrl,
          achievedAt: r.achievedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })
    );
  }

  async findById(id: string): Promise<DeveloperMilestone | null> {
    const r = await this.prisma.developerMilestone.findUnique({
      where: { id },
    });

    if (!r) return null;

    return new DeveloperMilestone({
      id: r.id,
      userId: r.userId,
      title: r.title,
      description: r.description,
      category: r.category as MilestoneCategory,
      icon: r.icon,
      linkUrl: r.linkUrl,
      achievedAt: r.achievedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }

  async create(input: CreateMilestoneInput): Promise<DeveloperMilestone> {
    const r = await this.prisma.developerMilestone.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        category: input.category,
        icon: input.icon,
        linkUrl: input.linkUrl,
        achievedAt: input.achievedAt,
      },
    });

    return new DeveloperMilestone({
      id: r.id,
      userId: r.userId,
      title: r.title,
      description: r.description,
      category: r.category as MilestoneCategory,
      icon: r.icon,
      linkUrl: r.linkUrl,
      achievedAt: r.achievedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.prisma.developerMilestone.findFirst({
      where: { id, userId },
    });

    if (!existing) return false;

    await this.prisma.developerMilestone.delete({
      where: { id },
    });

    return true;
  }
}
