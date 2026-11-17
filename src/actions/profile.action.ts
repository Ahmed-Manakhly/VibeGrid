"use server";

import { getCurrentSession } from "@/lib/auth/server";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action";

import { getProfileUseCase, updateProfileUseCase, isFollowingUseCase, logger } from "@/shared/infrastructure/di-container";

export async function getProfileByUsername(username: string) {
    try {
        return await getProfileUseCase.execute(username);
    } catch (error) {
        logger.error("Error fetching profile", error, { username });
        return null;
    }
}

export async function updateProfile(formData: FormData) {
    try {
        const session = await getCurrentSession();
        if (!session.isAuthenticated || !session.user) throw new Error("Unauthorized");
        
        const name = formData.get("name") as string;
        const username = formData.get("username") as string;
        // Validation: disallow temporary usernames prefixed with "user_"
        if (username && username.startsWith('user_')) {
          return { success: false, error: 'Temporary usernames are not allowed. Please choose a custom handle.' };
        }
        const bio = formData.get("bio") as string;
        const location = formData.get("location") as string;
        const website = formData.get("website") as string;
        const avatarMediaId = formData.get("avatarMediaId") as string | null;
        const acceptPolicy = formData.get("acceptPolicy") === "true";

        const rawTechStack = formData.get("techStack") as string | null;
        const rawDeveloperLinks = formData.get("developerLinks") as string | null;

        const { TechStackValueObject } = await import("@/modules/social/domain/TechStackValueObject");
        const { DeveloperLinksValueObject } = await import("@/modules/social/domain/DeveloperLinksValueObject");

        const updateData: any = { name, bio, location, website };
        if (acceptPolicy) {
            updateData.isPolicyAccepted = true;
            updateData.policyAcceptedAt = new Date();
        }
        if (username && username.trim() !== '') {
            updateData.username = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
        }

        if (rawTechStack !== null) {
            updateData.techStack = TechStackValueObject.parse(rawTechStack);
        }

        if (rawDeveloperLinks !== null) {
            updateData.developerLinks = DeveloperLinksValueObject.parse(rawDeveloperLinks);
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
        logger.error("Error updating profile", error);
        
        // Handle Prisma unique constraint violation for username (P2002)
        if (error.code === 'P2002' || error.message?.includes('Unique constraint failed on the fields: (`username`)')) {
            return { success: false, error: 'That username is already taken. Please choose a different handle.' };
        }

        return { success: false, error: error.message || "Failed to update profile" };
    }
}

export async function acceptPlatformPolicyAction() {
    try {
        const session = await getCurrentSession();
        if (!session.isAuthenticated || !session.user) {
            return { success: false, error: "Unauthorized" };
        }

        const result = await updateProfileUseCase.execute(session.user.id, {
            isPolicyAccepted: true,
            policyAcceptedAt: new Date(),
        });

        revalidatePath("/");
        revalidatePath("/explore");
        revalidatePath("/notifications");
        revalidatePath("/settings");
        if (result?.user?.username) {
            revalidatePath(`/profile/${result.user.username}`);
        }

        return { success: true, user: result.user };
    } catch (err: any) {
        logger.error("Failed to accept platform policy", err);
        return { success: false, error: err.message || "Failed to accept platform policy" };
    }
}

export async function isFollowing(userId: string) {
    try {
        const currentUserId = await getDbUserId();
        if (!currentUserId) return false;
        return await isFollowingUseCase.execute(currentUserId, userId);
    } catch (error) {
        logger.error("Error checking follow status", error, { userId });
        return false;
    }
}

export async function getMilestonesAction(userId: string) {
    try {
        const { milestoneRepository, cacheService } = await import("@/shared/infrastructure/di-container");
        const cacheKey = `user:${userId}:milestones`;
        const cached = await cacheService.get<any[]>(cacheKey);
        if (cached) return cached;

        const milestones = await milestoneRepository.findByUserId(userId);
        const serialized = milestones.map(m => ({
            id: m.id,
            userId: m.userId,
            title: m.title,
            description: m.description,
            category: m.category,
            icon: m.icon,
            linkUrl: m.linkUrl,
            achievedAt: m.achievedAt.toISOString(),
            createdAt: m.createdAt.toISOString(),
            updatedAt: m.updatedAt.toISOString(),
        }));

        await cacheService.set(cacheKey, serialized, 300); // 5 min TTL
        return serialized;
    } catch (error) {
        logger.error("Error fetching milestones", error, { userId });
        return [];
    }
}

export async function createMilestoneAction(formData: FormData) {
    try {
        const session = await getCurrentSession();
        if (!session.isAuthenticated || !session.user) {
            return { success: false, error: "Unauthorized" };
        }

        const title = formData.get("title") as string;
        const description = (formData.get("description") as string) || null;
        const category = (formData.get("category") as any) || "RELEASE";
        const icon = (formData.get("icon") as string) || null;
        const linkUrl = (formData.get("linkUrl") as string) || null;
        const achievedAtStr = formData.get("achievedAt") as string;

        if (!title || !title.trim()) {
            return { success: false, error: "Milestone title is required." };
        }

        const achievedAt = achievedAtStr ? new Date(achievedAtStr) : new Date();

        const { milestoneRepository, cacheService } = await import("@/shared/infrastructure/di-container");
        const milestone = await milestoneRepository.create({
            userId: session.user.id,
            title,
            description,
            category,
            icon,
            linkUrl,
            achievedAt,
        });

        // Invalidate cache
        await cacheService.delete(`user:${session.user.id}:milestones`);
        if (session.user.username) {
            revalidatePath(`/profile/${session.user.username}`);
        }

        return {
            success: true,
            milestone: {
                id: milestone.id,
                userId: milestone.userId,
                title: milestone.title,
                description: milestone.description,
                category: milestone.category,
                icon: milestone.icon,
                linkUrl: milestone.linkUrl,
                achievedAt: milestone.achievedAt.toISOString(),
            },
        };
    } catch (error: any) {
        logger.error("Error creating milestone", error);
        return { success: false, error: error.message || "Failed to create milestone" };
    }
}

export async function deleteMilestoneAction(id: string) {
    try {
        const session = await getCurrentSession();
        if (!session.isAuthenticated || !session.user) {
            return { success: false, error: "Unauthorized" };
        }

        const { milestoneRepository, cacheService } = await import("@/shared/infrastructure/di-container");
        const deleted = await milestoneRepository.delete(id, session.user.id);
        if (!deleted) {
            return { success: false, error: "Milestone not found or unauthorized to delete." };
        }

        await cacheService.delete(`user:${session.user.id}:milestones`);
        if (session.user.username) {
            revalidatePath(`/profile/${session.user.username}`);
        }

        return { success: true };
    } catch (error: any) {
        logger.error("Error deleting milestone", error);
        return { success: false, error: error.message || "Failed to delete milestone" };
    }
}

export async function getUserFollowersAction(userId: string) {
    try {
        const { prisma } = await import("@/shared/infrastructure/prisma");
        const session = await getCurrentSession();
        const currentUserId = session?.user?.id;

        const followers = await prisma.follows.findMany({
            where: { followingId: userId },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        bio: true,
                        role: true,
                        followers: currentUserId ? {
                            where: { followerId: currentUserId },
                            select: { followerId: true },
                        } : false,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return {
            success: true,
            data: followers.map((f: any) => ({
                id: f.follower.id,
                name: f.follower.name,
                username: f.follower.username,
                image: f.follower.image,
                bio: f.follower.bio,
                role: f.follower.role,
                isFollowing: currentUserId ? (f.follower as any).followers?.length > 0 : false,
            })),
        };
    } catch (error) {
        logger.error("Error fetching followers", error, { userId });
        return { success: false, data: [] };
    }
}

export async function getUserFollowingAction(userId: string) {
    try {
        const { prisma } = await import("@/shared/infrastructure/prisma");
        const session = await getCurrentSession();
        const currentUserId = session?.user?.id;

        const following = await prisma.follows.findMany({
            where: { followerId: userId },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        bio: true,
                        role: true,
                        followers: currentUserId ? {
                            where: { followerId: currentUserId },
                            select: { followerId: true },
                        } : false,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return {
            success: true,
            data: following.map((f: any) => ({
                id: f.following.id,
                name: f.following.name,
                username: f.following.username,
                image: f.following.image,
                bio: f.following.bio,
                role: f.following.role,
                isFollowing: currentUserId ? (f.following as any).followers?.length > 0 : false,
            })),
        };
    } catch (error) {
        logger.error("Error fetching following", error, { userId });
        return { success: false, data: [] };
    }
}


