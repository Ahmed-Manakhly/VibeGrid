//1st we create the [profile.action.ts]  | go there and check the logic
// placing generateMetadata here | which is a next fun to change the tile dynamically for ex | it will also has an access to the params
//so we can set the metaData based on this user and all the info about him

export const dynamic = "force-dynamic";

import {
    getProfileByUsername,
    isFollowing,
} from "@/actions/profile.action"; // server actions
import { getPosts } from "@/actions/post.action";
import { notFound } from "next/navigation"; // not found fun from next
//-----------------
import ProfilePageClient from "./ProfilePageClient";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> | { username: string } }) {
    const resolvedParams = await params;
    const user = await getProfileByUsername(resolvedParams.username);
    if (!user) return;

    return {
        title: `${user.name ?? user.username}`, // show the name if ex, or use he isername instead
        description: user.bio || `Check out ${user.username}'s profile.`, // if there is bio show it else show check ex-user profile
    };
} //setting the meta tags based on the profile of the user

async function ProfilePageServer({ params }: { params: Promise<{ username: string }> | { username: string } }) {
    const resolvedParams = await params;
    const user = await getProfileByUsername(resolvedParams.username); // use the server action that return the user based on the username param
    if (!user) notFound();  // notFound is a next fun to navigate to the notfound page | it should be the global one we have created 
                            //but as we got a new one created specifically for this route it will use the nearest one
                            //check the not-found page 
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

    return (
        <ProfilePageClient
        user={user}
        postsResult={postsResult}
        likedPostsResult={likedPostsResult}
        isFollowing={isCurrentUserFollowing}
        initialMilestones={initialMilestones}
        userCommunities={userCommunities}
        initialFollowers={followersRes.success ? followersRes.data : []}
        initialFollowing={followingRes.success ? followingRes.data : []}
        />
    );
}
export default ProfilePageServer;