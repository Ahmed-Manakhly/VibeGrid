"use server";

import { getDbUserId } from "./user.action";
import { getNotificationsUseCase, markAsReadUseCase } from "@/shared/infrastructure/di-container";

export async function getNotifications() {
    try {
        const userId = await getDbUserId();
        if (!userId) return [];
        return await getNotificationsUseCase.execute(userId);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("Failed to fetch notifications");
    }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
    try {
        const result = await markAsReadUseCase.execute(notificationIds);
        return { success: result.success };
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return { success: false };
    }
}
