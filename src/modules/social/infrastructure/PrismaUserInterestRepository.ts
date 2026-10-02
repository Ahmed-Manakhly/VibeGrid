import { PrismaClient } from '@prisma/client';
import { IUserInterestRepository } from '@/modules/social/domain/IUserInterestRepository';

export class PrismaUserInterestRepository implements IUserInterestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserInterests(userId: string) {
    const interests = await this.prisma.userInterest.findMany({
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
    return interests.map((i) => i.category);
  }

  async setUserInterests(userId: string, categoryIds: string[]) {
    // atomic replace: delete then create within a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.userInterest.deleteMany({ where: { userId } });
      const creates = categoryIds.map((catId) => ({ userId, categoryId: catId }));
      if (creates.length) {
        await tx.userInterest.createMany({ data: creates });
      }
    });
  }
}
