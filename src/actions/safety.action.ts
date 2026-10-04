"use server";

import { getCurrentSession } from "@/lib/auth/server";
import { getDbUserId } from "./user.action";
import {
  blockUserUseCase,
  unblockUserUseCase,
  createReportUseCase,
  trustSafetyRepository,
  logger,
} from "@/shared/infrastructure/di-container";

export async function blockUserAction(targetUserId: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) return { success: false, error: "Unauthorized" };
    const blockerId = await getDbUserId();
    if (!blockerId) return { success: false, error: "User not synced" };

    await blockUserUseCase.execute(blockerId, targetUserId);
    return { success: true };
  } catch (err: any) {
    logger.error("Error in blockUserAction", err);
    return { success: false, error: err.message || "Failed to block user" };
  }
}

export async function unblockUserAction(targetUserId: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) return { success: false, error: "Unauthorized" };
    const blockerId = await getDbUserId();
    if (!blockerId) return { success: false, error: "User not synced" };

    await unblockUserUseCase.execute(blockerId, targetUserId);
    return { success: true };
  } catch (err: any) {
    logger.error("Error in unblockUserAction", err);
    return { success: false, error: err.message || "Failed to unblock user" };
  }
}

export async function checkIsBlockedAction(targetUserId: string) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) return { isBlocked: false };
    const currentUserId = await getDbUserId();
    if (!currentUserId) return { isBlocked: false };

    const isBlocked = await trustSafetyRepository.isBlocked(currentUserId, targetUserId);
    return { isBlocked };
  } catch (err) {
    return { isBlocked: false };
  }
}

export async function createReportAction(params: {
  targetType: 'USER' | 'POST' | 'COMMENT';
  targetId: string;
  reason: string;
  description?: string;
}) {
  try {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) return { success: false, error: "Unauthorized" };
    const reporterId = await getDbUserId();
    if (!reporterId) return { success: false, error: "User not synced" };

    const report = await createReportUseCase.execute({
      reporterId,
      ...params,
    });

    return { success: true, report };
  } catch (err: any) {
    logger.error("Error in createReportAction", err);
    return { success: false, error: err.message || "Failed to submit report" };
  }
}
