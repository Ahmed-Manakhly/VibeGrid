//1st we create the [profile.action.ts]  | go there and check the logic
// placing generateMetadata here | which is a next fun to change the tile dynamically for ex | it will also has an access to the params
//so we can set the metaData based on this user and all the info about him

import {
    getProfileByUsername,
    getUserPosts,
    getUserLikedPosts,
    isFollowing,
} from "@/actions/profile.action"; // server actions
import { notFound } from "next/navigation"; // not found fun from next
//-----------------
import ProfilePageClient from "./ProfilePageClient";

export async function generateMetadata({ params }: { params: { username: string } }) {
    const user = await getProfileByUsername(params.username);
    if (!user) return;

    return {
        title: `${user.name ?? user.username}`, // show the name if ex, or use he isername instead
        description: user.bio || `Check out ${user.username}'s profile.`, // if there is bio show it else show check ex-user profile
    };
} //setting the meta tags based on the profile of the user

async function ProfilePageServer({ params }: { params: { username: string } }) {
    const user = await getProfileByUsername(params.username); // use the server action that return the user based on the username param
    if (!user) notFound();  // notFound is a next fun to navigate to the notfound page | it should be the global one we have created 
                            //but as we got a new one created specifically for this route it will use the nearest one
                            //check the not-found page 
    const [posts, likedPosts, isCurrentUserFollowing] = await Promise.all([
        getUserPosts(user.id),
        getUserLikedPosts(user.id),
        isFollowing(user.id),
    ]); // using an array of Promises to get all the needed data and destructure all of the results

    return (
        <ProfilePageClient
        user={user}
        posts={posts}
        likedPosts={likedPosts}
        isFollowing={isCurrentUserFollowing}
        />
    );
}
export default ProfilePageServer;