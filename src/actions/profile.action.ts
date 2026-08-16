"use server";

import { auth } from "@clerk/nextjs/server";
import {prisma} from "@/shared/infrastructure/prisma";
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
        const { userId: clerkId } = await auth();
        if (!clerkId) throw new Error("Unauthorized");
        const name = formData.get("name") as string;
        const bio = formData.get("bio") as string;
        const location = formData.get("location") as string;
        const website = formData.get("website") as string;
        const user = await updateProfileUseCase.execute(clerkId, {
            name,
            bio,
            location,
            website,
        });
        revalidatePath("/profile");
        return user;
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