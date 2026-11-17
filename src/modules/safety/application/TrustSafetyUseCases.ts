import { ITrustSafetyRepository } from "../domain/ITrustSafetyRepository";

export class BlockUserUseCase {
  constructor(private readonly safetyRepo: ITrustSafetyRepository) {}

  async execute(blockerId: string, blockedId: string): Promise<{ evictedCommunitiesCount: number } | void> {
    if (!blockerId || !blockedId) throw new Error("Invalid parameters for block user");
    if (blockerId === blockedId) throw new Error("You cannot block yourself");

    return await this.safetyRepo.blockUser(blockerId, blockedId);
  }
}

export class UnblockUserUseCase {
  constructor(private readonly safetyRepo: ITrustSafetyRepository) {}

  async execute(blockerId: string, blockedId: string): Promise<void> {
    if (!blockerId || !blockedId) throw new Error("Invalid parameters for unblock user");
    await this.safetyRepo.unblockUser(blockerId, blockedId);
  }
}

export class CreateReportUseCase {
  constructor(private readonly safetyRepo: ITrustSafetyRepository) {}

  async execute(params: {
    reporterId: string;
    targetType: 'USER' | 'POST' | 'COMMENT';
    targetId: string;
    reason: string;
    description?: string;
  }) {
    if (!params.reporterId) throw new Error("Unauthorized reporter");
    if (!params.targetId || !params.reason) throw new Error("Missing required report parameters");

    return await this.safetyRepo.createReport(params);
  }
}
