"use server";

import { getDbUserId } from "./user.action";
import { getNotificationsUseCase, markAsReadUseCase, logger } from "@/shared/infrastructure/di-container";

export async function getNotifications(options?: { limit?: number; cursor?: string }) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, notifications: [], nextCursor: null, unreadCount: 0 };
        const [result, unreadCount] = await Promise.all([
            getNotificationsUseCase.execute(userId, options),
            getNotificationsUseCase.getUnreadCount(userId)
        ]);
        return { success: true, ...result, unreadCount };
    } catch (error) {
        logger.error("Error fetching notifications", error);
        return { success: false, notifications: [], nextCursor: null, unreadCount: 0 };
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

export async function markAllNotificationsAsReadAction() {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "Unauthorized" };
        const { notificationRepository } = await import("@/shared/infrastructure/di-container");
        const success = await notificationRepository.markAllAsRead(userId);
        return { success };
    } catch (error: any) {
        logger.error("Error marking all notifications as read", error);
        return { success: false, error: error?.message || "Failed to mark all as read" };
    }
}

export async function deleteNotificationAction(notificationId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return { success: false, error: "Unauthorized" };
        const { notificationRepository } = await import("@/shared/infrastructure/di-container");
        const success = await notificationRepository.deleteNotification(notificationId, userId);
        return { success };
    } catch (error: any) {
        logger.error("Error deleting notification", error, { notificationId });
        return { success: false, error: error?.message || "Failed to delete notification" };
    }
}

