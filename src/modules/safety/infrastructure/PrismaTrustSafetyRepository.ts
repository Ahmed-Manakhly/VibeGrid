import { PrismaClient } from "@prisma/client";
import { ITrustSafetyRepository, UserReportEntity } from "../domain/ITrustSafetyRepository";

export class PrismaTrustSafetyRepository implements ITrustSafetyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async blockUser(blockerId: string, blockedId: string): Promise<{ evictedCommunitiesCount: number }> {
    if (blockerId === blockedId) {
      throw new Error("Cannot block yourself");
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create UserBlock record
      await tx.userBlock.upsert({
        where: {
          blockerId_blockedId: { blockerId, blockedId },
        },
        create: { blockerId, blockedId },
        update: {},
      });

      // 2. Sever mutual social graph (Follows in both directions)
      await tx.follows.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      });

      // 3. Auto-evict from owned communities:
      // Communities created by blockedId where blockerId is a member
      const blockedCreatedCommunities = await tx.community.findMany({
        where: { creatorId: blockedId },
        select: { id: true },
      });
      const blockedCommunityIds = blockedCreatedCommunities.map((c) => c.id);
      let evictedCount = 0;
      if (blockedCommunityIds.length > 0) {
        const delRes = await tx.communityMember.deleteMany({
          where: {
            userId: blockerId,
            communityId: { in: blockedCommunityIds },
          },
        });
        evictedCount += delRes.count;
      }

      // Also evict blockedId from blockerId's owned communities
      const blockerCreatedCommunities = await tx.community.findMany({
        where: { creatorId: blockerId },
        select: { id: true },
      });
      const blockerCommunityIds = blockerCreatedCommunities.map((c) => c.id);
      if (blockerCommunityIds.length > 0) {
        await tx.communityMember.deleteMany({
          where: {
            userId: blockedId,
            communityId: { in: blockerCommunityIds },
          },
        });
      }

      // 4. Dual-copy hide direct conversations between blockerId and blockedId
      const sharedConversations = await tx.conversation.findMany({
        where: {
          AND: [
            { participants: { some: { userId: blockerId } } },
            { participants: { some: { userId: blockedId } } },
          ],
        },
        select: { id: true },
      });
      if (sharedConversations.length > 0) {
        const convoIds = sharedConversations.map((c) => c.id);
        await tx.conversationParticipant.updateMany({
          where: {
            conversationId: { in: convoIds },
            userId: blockerId,
          },
          data: { isHidden: true, clearedAt: new Date() },
        });
      }

      return { evictedCommunitiesCount: evictedCount };
    });
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.prisma.userBlock.deleteMany({
      where: { blockerId, blockedId },
    });
  }

  async isBlocked(userA: string, userB: string): Promise<boolean> {
    if (!userA || !userB || userA === userB) return false;

    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });

    return Boolean(block);
  }

  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });
    return Array.from(new Set(blocks.map((b: any) => (b.blockerId === userId ? b.blockedId : b.blockerId))));
  }

  async createReport(data: {
    reporterId: string;
    targetType: 'USER' | 'POST' | 'COMMENT';
    targetId: string;
    reason: string;
    description?: string;
  }): Promise<UserReportEntity> {
    const report = await this.prisma.userReport.create({
      data: {
        reporterId: data.reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
      },
    });

    return {
      id: report.id,
      reporterId: report.reporterId,
      targetType: report.targetType as any,
      targetId: report.targetId,
      reason: report.reason,
      description: report.description,
      createdAt: report.createdAt,
    };
  }

  async getReports(limit: number = 50): Promise<UserReportEntity[]> {
    const reports = await this.prisma.userReport.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    return reports.map((r: any) => ({
      id: r.id,
      reporterId: r.reporterId,
      targetType: r.targetType as any,
      targetId: r.targetId,
      reason: r.reason,
      description: r.description,
      createdAt: r.createdAt,
    }));
  }
}
