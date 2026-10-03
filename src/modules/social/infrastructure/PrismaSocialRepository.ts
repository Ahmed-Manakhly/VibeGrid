import { ISocialRepository } from "../domain/ISocialRepository";
import { PrismaClient } from "@prisma/client";

export class PrismaSocialRepository implements ISocialRepository {
  constructor(private db: PrismaClient) {}

  async getSuggestedUsers(currentUserId?: string): Promise<any[]> {
    try {
      const whereCondition = currentUserId
        ? {
            AND: [
              { NOT: { id: currentUserId } },
              { NOT: { followers: { some: { followerId: currentUserId } } } },
            ],
          }
        : {};

      return this.db.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          _count: { select: { followers: true, posts: true } },
        },
        orderBy: {
          followers: { _count: "desc" },
        },
        take: 3,
      });
    } catch (err) {
      const { logger } = require("@/shared/infrastructure/di-container");
      logger.error("couldn't fetch suggested users!", err);
      return [];
    }
  }

  async searchUsers(query: string, limit: number = 6): Promise<any[]> {
    try {
      if (!query || !query.trim()) return [];
      const searchTerm = query.trim();
      return this.db.user.findMany({
        where: {
          OR: [
            { username: { contains: searchTerm, mode: "insensitive" } },
            { name: { contains: searchTerm, mode: "insensitive" } },
            { bio: { contains: searchTerm, mode: "insensitive" } },
            { location: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          location: true,
          website: true,
          _count: { select: { followers: true, posts: true } },
        },
        orderBy: [
          { username: "asc" },
        ],
        take: limit,
      });
    } catch (err) {
      const { logger } = require("@/shared/infrastructure/di-container");
      logger.error("Error searching users", err, { query });
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

  async getFollowerIds(followingId: string): Promise<string[]> {
    const records = await this.db.follows.findMany({
      where: { followingId },
      select: { followerId: true },
    });
    return records.map((r) => r.followerId);
  }
}
