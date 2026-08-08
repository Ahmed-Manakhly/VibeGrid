import { ISocialRepository } from "../domain/ISocialRepository";
import { PrismaClient } from "@prisma/client";

export class PrismaSocialRepository implements ISocialRepository {
  constructor(private db: PrismaClient) {}

  async getSuggestedUsers(currentUserId: string): Promise<any[]> {
    try {
      return this.db.user.findMany({
        where: {
          AND: [
            { NOT: { id: currentUserId } },
            { NOT: { followers: { some: { followerId: currentUserId } } } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          _count: { select: { followers: true } },
        },
        take: 3,
      });
    } catch (err) {
      console.error("couldn't fetch suggested users!", err);
      return [];
    }
  }

  async getFollow(followerId: string, followingId: string): Promise<any> {
    return this.db.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  async addFollow(followerId: string, followingId: string): Promise<void> {
    await this.db.follows.create({
      data: { followerId, followingId },
    });
  }

  async removeFollow(followerId: string, followingId: string): Promise<void> {
    await this.db.follows.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
  }
}
