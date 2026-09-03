"use server";

import { getCurrentSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { 
    syncUserUseCase, 
    getUserUseCase, 
    toggleFollowUseCase, 
    getSuggestedUsersUseCase 
} from "@/shared/infrastructure/di-container";

export async function syncUser() {
    try {
        const session = await getCurrentSession();
        if (!session.isAuthenticated || !session.user) return;
        return await syncUserUseCase.execute(session.user.id, session.user);
    } catch (err) {
        console.error("Error syncing user:", err);
    }
}

export async function getUserByClerkId(clerkId: string) {
    return await getUserUseCase.execute(clerkId);
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
        console.error("couldn't fetch users!", err);
        return [];
    }
}

export async function toggleFollow(targetUserId: string) {
    try {
        const userId = await getDbUserId();
        if (!userId) return;
        
        const result = await toggleFollowUseCase.execute(userId, targetUserId);
        
        revalidatePath("/");
        return result;
    } catch (error) {
        console.error("Error in toggleFollow", error);
        return { success: false, error: "Error toggling follow" };
    }
}

