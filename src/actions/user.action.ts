"use server";

import { getCurrentSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { 
    syncUserUseCase, 
    getUserUseCase, 
    toggleFollowUseCase, 
    getSuggestedUsersUseCase,
    searchUsersUseCase,
    logger
} from "@/shared/infrastructure/di-container";

export async function syncUser() {
    try {
        const session = await getCurrentSession();
        if (!session.isAuthenticated || !session.user) return;
        return await syncUserUseCase.execute(session.user.id, session.user);
    } catch (err) {
        logger.error("Error syncing user", err);
    }
}

export async function getUserById(userId: string) {
    return await getUserUseCase.execute(userId);
}

export async function getDbUserId() {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) return null;
    return session.user.id;
}

export async function getRandomUsers() {
    try {
        const userId = await getDbUserId();
        if (!userId) return [];
        return await getSuggestedUsersUseCase.execute(userId);
    } catch (err) {
        logger.error("Could not fetch suggested users", err);
        return [];
    }
}

export async function searchUsers(query: string) {
    try {
        if (!query || !query.trim()) return [];
        const currentUserId = await getDbUserId();
        return await searchUsersUseCase.execute(query, 6, currentUserId || undefined);
    } catch (err) {
        logger.error("Error searching users", err, { query });
        return [];
    }
}

export async function toggleFollow(targetUserId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return;
        
        const result = await toggleFollowUseCase.execute(userId, targetUserId);
        
        revalidatePath("/");
        revalidatePath("/explore");
        revalidatePath("/profile/[username]", "page");
        return result;
    } catch (error) {
        logger.error("Error in toggleFollow", error, { targetUserId });
        return { success: false, error: "Error toggling follow" };
    }
}


