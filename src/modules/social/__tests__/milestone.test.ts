import { DeveloperMilestone } from '../domain/DeveloperMilestone';
import { PrismaMilestoneRepository } from '../infrastructure/PrismaMilestoneRepository';

describe('DeveloperMilestone Domain Entity', () => {
  it('instantiates valid milestone with trimmed fields', () => {
    const now = new Date();
    const milestone = new DeveloperMilestone({
      id: 'm1',
      userId: 'u1',
      title: '  Shipped VibeGrid v1.0  ',
      description: '  Launched initial MVP on ProductHunt  ',
      category: 'RELEASE',
      icon: 'rocket',
      linkUrl: 'https://vibegrid.dev',
      achievedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    expect(milestone.title).toBe('Shipped VibeGrid v1.0');
    expect(milestone.description).toBe('Launched initial MVP on ProductHunt');
    expect(milestone.category).toBe('RELEASE');
  });

  it('throws error when title is empty', () => {
    expect(() => {
      new DeveloperMilestone({
        id: 'm2',
        userId: 'u1',
        title: '   ',
        category: 'OPEN_SOURCE',
        achievedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('Milestone title cannot be empty.');
  });

  it('throws error when title exceeds 120 characters', () => {
    expect(() => {
      new DeveloperMilestone({
        id: 'm3',
        userId: 'u1',
        title: 'a'.repeat(121),
        category: 'EDUCATION',
        achievedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('Milestone title cannot exceed 120 characters.');
  });
});

describe('PrismaMilestoneRepository', () => {
  it('calls prisma create and returns domain entity', async () => {
    const mockPrisma: any = {
      developerMilestone: {
        create: jest.fn().mockResolvedValue({
          id: 'rec_1',
          userId: 'user_1',
          title: 'Promoted to Staff Engineer',
          description: null,
          category: 'PROMOTION',
          icon: 'briefcase',
          linkUrl: null,
          achievedAt: new Date('2026-01-01'),
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
    };

    const repo = new PrismaMilestoneRepository(mockPrisma);
    const result = await repo.create({
      userId: 'user_1',
      title: 'Promoted to Staff Engineer',
      category: 'PROMOTION',
      icon: 'briefcase',
      achievedAt: new Date('2026-01-01'),
    });

    expect(mockPrisma.developerMilestone.create).toHaveBeenCalled();
    expect(result.id).toBe('rec_1');
    expect(result.title).toBe('Promoted to Staff Engineer');
  });

  it('deletes milestone only if user matches owner', async () => {
    const mockPrisma: any = {
      developerMilestone: {
        findFirst: jest.fn().mockResolvedValue({ id: 'rec_1', userId: 'user_1' }),
        delete: jest.fn().mockResolvedValue({ id: 'rec_1' }),
      },
    };

    const repo = new PrismaMilestoneRepository(mockPrisma);
    const success = await repo.delete('rec_1', 'user_1');
    expect(success).toBe(true);
    expect(mockPrisma.developerMilestone.delete).toHaveBeenCalledWith({ where: { id: 'rec_1' } });
  });

  it('returns false on delete if milestone not owned by user', async () => {
    const mockPrisma: any = {
      developerMilestone: {
        findFirst: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
      },
    };

    const repo = new PrismaMilestoneRepository(mockPrisma);
    const success = await repo.delete('rec_1', 'stranger_user');
    expect(success).toBe(false);
    expect(mockPrisma.developerMilestone.delete).not.toHaveBeenCalled();
  });
});
