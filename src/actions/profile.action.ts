"use server";

import { getCurrentSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";

import { getProfileUseCase, updateProfileUseCase, isFollowingUseCase } from "@/shared/infrastructure/di-container";

export async function getProfileByUsername(username: string) {
    try {
        return await getProfileUseCase.execute(username);
    } catch (error) {
        console.error("Error fetching profile:", error);
        throw new Error("Failed to fetch profile");
    }
}

export async function updateProfile(formData: FormData) {
    try {
        const session = await getCurrentSession();
        if (!session.isAuthenticated || !session.user) throw new Error("Unauthorized");
        const name = formData.get("name") as string;
        const username = formData.get("username") as string;
        const bio = formData.get("bio") as string;
        const location = formData.get("location") as string;
        const website = formData.get("website") as string;

        const updateData: any = { name, bio, location, website };
        if (username && username.trim() !== '') {
            updateData.username = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
        }

        const result = await updateProfileUseCase.execute(session.user.id, updateData);
        revalidatePath("/");
        revalidatePath(`/profile/${result.user.username}`);
        return { success: true, user: result.user };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: "Failed to update profile" };
    }
}

export async function isFollowing(userId: string) {
    try {
        const currentUserId = await getDbUserId();
        if (!currentUserId) return false;
        return await isFollowingUseCase.execute(currentUserId, userId);
    } catch (error) {
        console.error("Error checking follow status:", error);
        return false;
    }
}