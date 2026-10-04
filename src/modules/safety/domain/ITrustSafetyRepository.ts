export interface UserBlockEntity {
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export interface UserReportEntity {
  id: string;
  reporterId: string;
  targetType: 'USER' | 'POST' | 'COMMENT';
  targetId: string;
  reason: string;
  description?: string | null;
  createdAt: Date;
}

export interface ITrustSafetyRepository {
  blockUser(blockerId: string, blockedId: string): Promise<void>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  isBlocked(userA: string, userB: string): Promise<boolean>;
  getBlockedUserIds(userId: string): Promise<string[]>;
  createReport(data: {
    reporterId: string;
    targetType: 'USER' | 'POST' | 'COMMENT';
    targetId: string;
    reason: string;
    description?: string;
  }): Promise<UserReportEntity>;
  getReports(limit?: number): Promise<UserReportEntity[]>;
}
