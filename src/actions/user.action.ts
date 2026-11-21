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

export async function isCurrentUserPolicyAccepted(): Promise<boolean> {
    const session = await getCurrentSession();
    if (!session.isAuthenticated || !session.user) return false;
    try {
        const { prisma } = await import("@/shared/infrastructure/prisma");
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { isPolicyAccepted: true },
        });
        return Boolean(user?.isPolicyAccepted);
    } catch {
        return false;
    }
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
        if (!userId) return { success: false, error: "Unauthorized" };

        const isPolicyAccepted = await isCurrentUserPolicyAccepted();
        if (!isPolicyAccepted) {
            return {
                success: false,
                requiresPolicy: true,
                error: "Please accept the platform policy to follow creators."
            };
        }
        
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

export interface MentionCandidate {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    badge?: "Author" | "Commenter" | "Following" | "Developer";
}

export async function getMentionSuggestionsAction(params: {
    query?: string;
    postId?: string;
}): Promise<MentionCandidate[]> {
    try {
        const currentUserId = await getDbUserId();
        const query = (params.query || "").trim().toLowerCase();
        const { prisma } = await import("@/shared/infrastructure/prisma");

        const candidatesMap = new Map<string, MentionCandidate>();

        // 1. Thread participants (if postId is provided)
        if (params.postId) {
            const post = await prisma.post.findUnique({
                where: { id: params.postId },
                select: {
                    author: { select: { id: true, name: true, username: true, image: true } },
                    comments: {
                        take: 20,
                        orderBy: { createdAt: "desc" },
                        select: {
                            author: { select: { id: true, name: true, username: true, image: true } },
                        },
                    },
                },
            });

            if (post?.author && post.author.id !== currentUserId) {
                candidatesMap.set(post.author.id, {
                    ...post.author,
                    badge: "Author",
                });
            }

            if (post?.comments) {
                for (const c of post.comments) {
                    if (c.author && c.author.id !== currentUserId && !candidatesMap.has(c.author.id)) {
                        candidatesMap.set(c.author.id, {
                            ...c.author,
                            badge: "Commenter",
                        });
                    }
                }
            }
        }

        // 2. Friends / Followed users
        if (currentUserId) {
            const follows = await prisma.follows.findMany({
                where: { followerId: currentUserId },
                take: 30,
                select: {
                    following: { select: { id: true, name: true, username: true, image: true } },
                },
            });

            for (const f of follows) {
                if (f.following && !candidatesMap.has(f.following.id)) {
                    candidatesMap.set(f.following.id, {
                        ...f.following,
                        badge: "Following",
                    });
                }
            }
        }

        // 3. If query is provided, search global users matching query
        if (query) {
            const matched = await prisma.user.findMany({
                where: {
                    id: currentUserId ? { not: currentUserId } : undefined,
                    OR: [
                        { username: { contains: query, mode: "insensitive" } },
                        { name: { contains: query, mode: "insensitive" } },
                    ],
                },
                take: 10,
                select: { id: true, name: true, username: true, image: true },
            });

            for (const u of matched) {
                if (!candidatesMap.has(u.id)) {
                    candidatesMap.set(u.id, {
                        ...u,
                        badge: "Developer",
                    });
                }
            }
        }

        let list = Array.from(candidatesMap.values());
        if (query) {
            list = list.filter(
                (c) =>
                    c.username.toLowerCase().includes(query) ||
                    (c.name && c.name.toLowerCase().includes(query))
            );
        }

        return list.slice(0, 8);
    } catch (err) {
        logger.error("Error in getMentionSuggestionsAction", err);
        return [];
    }
}


