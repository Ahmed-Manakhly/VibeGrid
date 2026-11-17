import { ISocialRepository } from "../domain/ISocialRepository";
import { PrismaClient, UserRole } from "@prisma/client";

export class PrismaSocialRepository implements ISocialRepository {
  constructor(private db: PrismaClient) { }

  async getSuggestedUsers(currentUserId?: string): Promise<any[]> {
    try {
      const whereCondition = currentUserId
        ? {
          AND: [
            { role: { not: UserRole.ADMIN } },
            { NOT: { id: currentUserId } },
            { NOT: { followers: { some: { followerId: currentUserId } } } },
            { NOT: { blockedUsers: { some: { blockedId: currentUserId } } } },
            { NOT: { blockedBy: { some: { blockerId: currentUserId } } } },
          ],
        }
        : {
          role: { not: UserRole.ADMIN },
        };

      // Retrieve candidates with their interest categories and followed tech
      const candidates = await this.db.user.findMany({
        where: whereCondition,
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          bio: true,
          interests: {
            select: {
              category: { select: { id: true, name: true, emoji: true } },
            },
          },
          followedTags: {
            select: {
              tag: { select: { id: true, name: true, slug: true } },
            },
          },
          followers: currentUserId
            ? {
              where: {
                follower: {
                  followers: { some: { followerId: currentUserId } },
                },
              },
              select: {
                follower: { select: { id: true, name: true, username: true } },
              },
              take: 1,
            }
            : false,
          _count: { select: { followers: true, posts: true } },
        },
        orderBy: {
          followers: { _count: "desc" },
        },
        take: 10,
      });

      if (!currentUserId || candidates.length === 0) {
        return candidates.slice(0, 3).map((u) => ({
          ...u,
          matchRationale: u._count.followers > 0 ? `${u._count.followers} followers` : "Active contributor",
        }));
      }

      // Fetch viewer's category interests
      const viewerInterests = await this.db.userInterest.findMany({
        where: { userId: currentUserId },
        select: { categoryId: true },
      });
      const viewerCategoryIds = new Set(viewerInterests.map((vi) => vi.categoryId));

      // Calculate match score and rationale
      const rankedCandidates = candidates.map((cand: any) => {
        const sharedCategories = (cand.interests || []).filter((i: any) =>
          viewerCategoryIds.has(i.category.id)
        );
        const mutualFollow = cand.followers && cand.followers.length > 0 ? cand.followers[0].follower : null;

        let matchRationale = "";
        let score = 0;

        if (mutualFollow) {
          matchRationale = `Followed by @${mutualFollow.username}`;
          score += 50;
        } else if (sharedCategories.length > 0) {
          const catName = sharedCategories[0].category.name;
          matchRationale = sharedCategories.length > 1
            ? `Shares ${sharedCategories.length} tech interests`
            : `Also interested in ${catName}`;
          score += 30 * sharedCategories.length;
        } else if (cand.followedTags && cand.followedTags.length > 0) {
          matchRationale = `Active in #${cand.followedTags[0].tag.name}`;
          score += 15;
        } else {
          matchRationale = cand._count.followers > 0 ? `${cand._count.followers} followers` : "Active contributor";
          score += cand._count.followers;
        }

        return {
          id: cand.id,
          name: cand.name,
          username: cand.username,
          image: cand.image,
          bio: cand.bio,
          _count: cand._count,
          matchRationale,
          score,
        };
      });

      rankedCandidates.sort((a, b) => b.score - a.score);
      return rankedCandidates.slice(0, 4);
    } catch (err) {
      const { logger } = require("@/shared/infrastructure/di-container");
      logger.error("couldn't fetch suggested users!", err);
      return [];
    }
  }

  async searchUsers(query: string, limit: number = 6, viewerId?: string): Promise<any[]> {
    try {
      if (!query || !query.trim()) return [];
      const formattedQuery = query.trim();

      const blockedCondition = viewerId
        ? {
            NOT: [
              { blockedUsers: { some: { blockedId: viewerId } } },
              { blockedBy: { some: { blockerId: viewerId } } },
            ],
          }
        : {};

      const matchedUsers = await this.db.user.findMany({
        where: {
          AND: [
            blockedCondition,
            {
              OR: [
                { username: { contains: formattedQuery, mode: "insensitive" as const } },
                { name: { contains: formattedQuery, mode: "insensitive" as const } },
              ],
            },
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
        orderBy: { username: "asc" },
        take: limit,
      });

      return matchedUsers;
    } catch (err) {
      const { logger } = require("@/shared/infrastructure/di-container");
      logger.error("Error searching users with FTS", err, { query });
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

  async getFollowingIds(followerId: string): Promise<string[]> {
    const records = await this.db.follows.findMany({
      where: { followerId },
      select: { followingId: true },
    });
    return records.map((r) => r.followingId);
  }
}
