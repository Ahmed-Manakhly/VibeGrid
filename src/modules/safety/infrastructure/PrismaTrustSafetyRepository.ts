import { PrismaClient } from "@prisma/client";
import { ITrustSafetyRepository, UserReportEntity } from "../domain/ITrustSafetyRepository";

export class PrismaTrustSafetyRepository implements ITrustSafetyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new Error("Cannot block yourself");
    }

    await this.prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
      create: { blockerId, blockedId },
      update: {},
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
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    return blocks.map((b) => b.blockedId);
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

    return reports.map((r) => ({
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
