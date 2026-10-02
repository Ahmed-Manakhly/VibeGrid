import { PrismaClient } from '@prisma/client';
import { IUserInterestRepository } from '@/modules/social/domain/IUserInterestRepository';

type CategoryDTO = {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
};

export class PrismaUserInterestRepository implements IUserInterestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Get categories the user is interested in
  async getUserInterests(userId: string): Promise<CategoryDTO[]> {
    const interests = await (this.prisma as any).userInterest.findMany({
      where: { userId },
      select: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            emoji: true,
          },
        },
      },
    });
    return interests.map((i: any) => i.category);
  }

  // Replace the user's interests atomically
  async setUserInterests(userId: string, categoryIds: string[]): Promise<void> {
    const creates = categoryIds.map((catId) => ({ userId, categoryId: catId }));
    await this.prisma.$transaction([
      (this.prisma as any).userInterest.deleteMany({ where: { userId } }),
      ...(creates.length ? [(this.prisma as any).userInterest.createMany({ data: creates })] : []),
    ]);
  }
}
