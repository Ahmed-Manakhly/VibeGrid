"use server";

import { getDbUserId } from "./user.action";
import { getNotificationsUseCase, markAsReadUseCase, logger } from "@/shared/infrastructure/di-container";

export async function getNotifications(options?: { limit?: number; cursor?: string }) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, notifications: [], nextCursor: null };
        const result = await getNotificationsUseCase.execute(userId, options);
        return { success: true, ...result };
    } catch (error) {
        logger.error("Error fetching notifications", error);
        return { success: false, notifications: [], nextCursor: null };
    }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
    try {
        const result = await markAsReadUseCase.execute(notificationIds);
        return { success: result.success };
    } catch (error) {
        logger.error("Error marking notifications as read", error, { notificationIds });
        return { success: false };
    }
}

