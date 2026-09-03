"use client";

import { getProfileByUsername } from "@/actions/profile.action";
import { getPosts } from "@/actions/post.action";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/components/auth/SessionProvider";
import { format } from "date-fns";
import {
    CalendarIcon,
    EditIcon,
    FileTextIcon,
    HeartIcon,
    LinkIcon,
    MapPinIcon,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { FollowButton } from "@/modules/social/presentation/components/FollowButton";
import { EditProfileModal } from "@/modules/social/presentation/components/EditProfileModal";

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type PostsResult = Awaited<ReturnType<typeof getPosts>>;

interface ProfilePageClientProps {
    user: NonNullable<User>;
    postsResult: PostsResult;
    likedPostsResult: PostsResult;
    isFollowing: boolean;
}

function ProfilePageClient({
    isFollowing: initialIsFollowing,
    likedPostsResult,
    postsResult,
    user,
}: ProfilePageClientProps) {
    const { user: currentUser, isAuthenticated } = useSession();
    const [showEditDialog, setShowEditDialog] = useState(false);

    const isOwnProfile = currentUser?.id === user.id;
    const formattedDate = format(new Date(user.createdAt), "MMMM yyyy");

    return (
        <div className="w-full">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-[350px] shrink-0 sticky top-24 lg:mt-[56px]">
                    <Card className="bg-card">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="w-24 h-24">
                                    <AvatarImage src={user.image ?? "/avatar.png"} />
                                    <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <h1 className="mt-4 text-2xl font-bold">{user.name ?? user.username}</h1>
                                <p className="text-muted-foreground">@{user.username}</p>
                                <p className="mt-2 text-sm">{user.bio}</p>
                                <div className="w-full mt-6">
                                    <div className="flex justify-between mb-4">
                                        <div>
                                            <div className="font-semibold">{user._count.following.toLocaleString()}</div>
                                            <div className="text-sm text-muted-foreground">Following</div>
                                        </div>
                                        <Separator orientation="vertical" />
                                        <div>
                                            <div className="font-semibold">{user._count.followers.toLocaleString()}</div>
                                            <div className="text-sm text-muted-foreground">Followers</div>
                                        </div>
                                        <Separator orientation="vertical" />
                                        <div>
                                            <div className="font-semibold">{user._count.posts.toLocaleString()}</div>
                                            <div className="text-sm text-muted-foreground">Posts</div>
                                        </div>
                                    </div>
                                </div>
                                {!isAuthenticated ? (
                                    <Button className="w-full mt-4" asChild>
                                        <Link href="/login">Follow</Link>
                                    </Button>
                                ) : isOwnProfile ? (
                                    <Button className="w-full mt-4" onClick={() => setShowEditDialog(true)}>
                                        <EditIcon className="size-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <FollowButton
                                        className="w-full mt-4"
                                        targetUserId={user.id}
                                        initialIsFollowing={initialIsFollowing}
                                    />
                                )}
                                <div className="w-full mt-6 space-y-2 text-sm">
                                    {user.location && (
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPinIcon className="size-4 mr-2" />
                                            {user.location}
                                        </div>
                                    )}
                                    {user.website && (
                                        <div className="flex items-center text-muted-foreground">
                                            <LinkIcon className="size-4 mr-2" />
                                            <a
                                                href={
                                                user.website.startsWith("http") ? user.website : `https://${user.website}`
                                                }
                                                className="hover:underline"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {user.website}
                                            </a>
                                        </div>
                                    )}
                                    <div className="flex items-center text-muted-foreground">
                                        <CalendarIcon className="size-4 mr-2" />
                                        Joined {formattedDate}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="w-full min-w-0 flex-1">
                    <Tabs defaultValue="posts" className="w-full">
                        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                            <TabsTrigger
                                value="posts"
                                className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
                                data-[state=active]:bg-transparent px-6 font-semibold"
                            >
                                <FileTextIcon className="size-4" />
                                Posts
                            </TabsTrigger>
                            <TabsTrigger
                                value="likes"
                                className="flex items-center gap-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary
                                data-[state=active]:bg-transparent px-6 font-semibold"
                            >
                                <HeartIcon className="size-4" />
                                Likes
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="posts" className="mt-6">
                            <div className="space-y-6">
                                <InfiniteScroll 
                                    initialPosts={postsResult.data}
                                    initialNextCursor={postsResult.nextCursor}
                                    apiUrl={`/api/posts?authorId=${user.id}`}
                                    dbUserId={currentUser ? user.id : null}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="likes" className="mt-6">
                            <div className="space-y-6">
                                <InfiniteScroll 
                                    initialPosts={likedPostsResult.data}
                                    initialNextCursor={likedPostsResult.nextCursor}
                                    apiUrl={`/api/posts?likedByUserId=${user.id}`}
                                    dbUserId={currentUser ? user.id : null}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <EditProfileModal
                    user={user}
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                />
            </div>
        </div>
    );
}

export default ProfilePageClient;