"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { 
    syncUserUseCase, 
    getUserUseCase, 
    toggleFollowUseCase, 
    getSuggestedUsersUseCase 
} from "@/shared/infrastructure/di-container";

//1//to sync the User between clerk and Prisma/DB
export async function syncUser() {
    try {
        const { userId } = await auth();
        const user = await currentUser();
        if (!userId || !user) return;
        return await syncUserUseCase.execute(userId, user);
    } catch (err) {
        console.error("Error syncing user:", err);
    }
}

//2//to show the user data 
export async function getUserByClerkId(clerkId: string) {
    return await getUserUseCase.execute(clerkId);
}

//3//get db user id using clerkId from auth()
export async function getDbUserId() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;
    return await getUserUseCase.getDbUserId(clerkId);
}

//4//to fetch some users randomly
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

//5//to create the relation-follow from the current user to the suggested user
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
