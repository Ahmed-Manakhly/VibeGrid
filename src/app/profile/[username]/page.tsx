//1st we create the [profile.action.ts]  | go there and check the logic
// placing generateMetadata here | which is a next fun to change the tile dynamically for ex | it will also has an access to the params
//so we can set the metaData based on this user and all the info about him

export const dynamic = "force-dynamic";

import {
    getProfileByUsername,
    isFollowing,
} from "@/actions/profile.action"; // server actions
import { getPosts } from "@/actions/post.action";
import { getDbUserId } from "@/actions/user.action";
import { notFound, redirect } from "next/navigation"; // not found fun from next
import { trustSafetyRepository } from "@/shared/infrastructure/di-container";
import { getCurrentSession } from "@/lib/auth/server";
import { PageHeader } from "@/components/PageHeader";
import { ProfileSidebar } from "@/modules/social/presentation/components/ProfileSidebar";
import { ProfileTabsSection } from "@/modules/social/presentation/components/ProfileTabsSection";
import { UserCheck } from "lucide-react";
import {
    generatePageMetadata,
    getRouteKeywords,
    getProfileStructuredData,
    getBreadcrumbStructuredData,
} from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> | { username: string } }) {
    const resolvedParams = await params;
    const user = await getProfileByUsername(resolvedParams.username);
    if (!user) {
        return generatePageMetadata({
            title: "Developer Not Found",
            noIndex: true,
        });
    }

    return generatePageMetadata({
        title: `${user.name || user.username} (@${user.username})`,
        description: user.bio || `Developer profile of ${user.name || user.username} on VibeGrid. Tune in to projects and contributions.`,
        image: user.image,
        url: `/profile/${user.username}`,
        type: "profile",
        keywords: [
            ...getRouteKeywords("profile"),
            user.username,
            ...(user.name ? [user.name] : []),
        ],
    });
} //setting the meta tags based on the profile of the user

async function ProfilePageServer({ params }: { params: Promise<{ username: string }> | { username: string } }) {
    const resolvedParams = await params;
    const user = await getProfileByUsername(resolvedParams.username); // use the server action that return the user based on the username param
    if (!user) notFound();  // notFound is a next fun to navigate to the notfound page | it should be the global one we have created 
                            //but as we got a new one created specifically for this route it will use the nearest one
                            //check the not-found page 

    const currentUserId = await getDbUserId();
    if (currentUserId && currentUserId !== user.id) {
        const isBlocked = await trustSafetyRepository.isBlocked(currentUserId, user.id);
        if (isBlocked) {
            redirect("/?blocked=true");
        }
    }
    const [postsResult, likedPostsResult, isCurrentUserFollowing, initialMilestones, userCommunities, followersRes, followingRes] = await Promise.all([
        getPosts({ authorId: user.id }),
        getPosts({ likedByUserId: user.id }),
        isFollowing(user.id),
        (async () => {
            const { getMilestonesAction } = await import("@/actions/profile.action");
            return await getMilestonesAction(user.id);
        })(),
        (async () => {
            const { getUserCommunitiesAction } = await import("@/actions/community.action");
            const res = await getUserCommunitiesAction(user.id);
            return res.success && res.data ? res.data : [];
        })(),
        (async () => {
            const { getUserFollowersAction } = await import("@/actions/profile.action");
            return await getUserFollowersAction(user.id);
        })(),
        (async () => {
            const { getUserFollowingAction } = await import("@/actions/profile.action");
            return await getUserFollowingAction(user.id);
        })(),
    ]);

    const profileStructuredData = getProfileStructuredData({
        username: user.username,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.image,
        website: user.website,
    });

    const breadcrumbsStructuredData = getBreadcrumbStructuredData([
        { name: "Home", url: "/" },
        { name: "Developers", url: "/explore" },
        { name: `@${user.username}`, url: `/profile/${user.username}` },
    ]);

    const session = await getCurrentSession();

    return (
        <div className="w-full">
            {profileStructuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(profileStructuredData) }}
                />
            )}
            {breadcrumbsStructuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsStructuredData) }}
                />
            )}

            <PageHeader
                eyebrow="DEVELOPER IDENTITY"
                title={user.name ?? user.username}
                subtitle={`@${user.username} • Developer profile, milestones, and contributions.`}
                icon={UserCheck}
                className="mb-6"
            />

            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <ProfileSidebar
                    user={user}
                    currentUserId={currentUserId}
                    isAuthenticated={session.isAuthenticated}
                    initialIsFollowing={isCurrentUserFollowing}
                    hasMilestones={initialMilestones.length > 0}
                />

                <ProfileTabsSection
                    userId={user.id}
                    username={user.username}
                    currentUserId={currentUserId}
                    postsResult={postsResult}
                    likedPostsResult={likedPostsResult}
                    initialMilestones={initialMilestones}
                    userCommunities={userCommunities}
                    initialFollowers={followersRes.success ? followersRes.data : []}
                    initialFollowing={followingRes.success ? followingRes.data : []}
                    followersCount={user._count.followers}
                    followingCount={user._count.following}
                />
            </div>
        </div>
    );
}
export default ProfilePageServer;