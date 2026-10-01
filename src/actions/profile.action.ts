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
        return null;
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
        const avatarMediaId = formData.get("avatarMediaId") as string | null;

        const updateData: any = { name, bio, location, website };
        if (username && username.trim() !== '') {
            updateData.username = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
        }

        if (avatarMediaId && avatarMediaId.trim() !== '') {
            const { fetchServerMediaAsset } = await import('@/lib/media/server-media.client');
            const asset = await fetchServerMediaAsset(avatarMediaId);

            if (!asset || asset.status !== 'READY') {
                return { success: false, error: 'Invalid or unconfirmed avatar media asset' };
            }
            if (asset.ownerId !== session.user.id) {
                return { success: false, error: 'Unauthorized: You do not own this media asset' };
            }

            updateData.avatarMediaId = asset.id;
            updateData.image = asset.publicUrl; // Derived compatibility field
        }

        const result = await updateProfileUseCase.execute(session.user.id, updateData);
        revalidatePath("/");
        revalidatePath(`/profile/${result.user.username}`);
        return { success: true, user: result.user };
    } catch (error: any) {
        console.error("Error updating profile:", error);
        
        // Handle Prisma unique constraint violation for username (P2002)
        if (error.code === 'P2002' || error.message?.includes('Unique constraint failed on the fields: (`username`)')) {
            return { success: false, error: 'That username is already taken. Please choose a different handle.' };
        }

        return { success: false, error: error.message || "Failed to update profile" };
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