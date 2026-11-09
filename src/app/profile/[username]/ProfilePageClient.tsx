"use client";

import { getProfileByUsername } from "@/actions/profile.action";
import { getPosts } from "@/actions/post.action";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { UserAvatar } from "@/components/UserAvatar";
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
    MailIcon,
    BanIcon,
    ShieldAlertIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FollowButton } from "@/modules/social/presentation/components/FollowButton";
import { EditProfileModal } from "@/modules/social/presentation/components/EditProfileModal";
import { startConversationAction } from "@/actions/messaging.action";
import {
    DeveloperMilestoneTimeline,
    SerializedMilestone,
} from "@/modules/social/presentation/components/DeveloperMilestoneTimeline";
import { DeveloperBadgeList } from "@/modules/social/presentation/components/DeveloperBadgeList";
import { Milestone } from "lucide-react";

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type PostsResult = Awaited<ReturnType<typeof getPosts>>;

interface ProfilePageClientProps {
    user: NonNullable<User>;
    postsResult: PostsResult;
    likedPostsResult: PostsResult;
    isFollowing: boolean;
    initialMilestones?: SerializedMilestone[];
}

function ProfilePageClient({
    isFollowing: initialIsFollowing,
    likedPostsResult,
    postsResult,
    user,
    initialMilestones = [],
}: ProfilePageClientProps) {
    const { user: currentUser, isAuthenticated } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const isEditRequested = searchParams.get('edit') === 'true' || searchParams.get('complete') === 'true';
    const [showEditDialog, setShowEditDialog] = useState(isEditRequested);

    useEffect(() => {
        if (isEditRequested) {
            setShowEditDialog(true);
        }
    }, [isEditRequested]);

    const handleOpenChange = (open: boolean) => {
        setShowEditDialog(open);
        if (!open && isEditRequested) {
            router.replace(pathname, { scroll: false });
        }
    };

    const isOwnProfile = currentUser?.id === user.id;
    const formattedDate = format(new Date(user.createdAt), "MMMM yyyy");

    return (
        <div className="w-full">
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-[350px] shrink-0 relative lg:sticky lg:top-24 lg:mt-[56px] z-10">
                    <Card className="bg-card/90 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <UserAvatar src={user.image} name={user.name} className="w-24 h-24" />
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
                                    <div className="flex flex-col w-full gap-2 mt-4">
                                        <div className="flex w-full gap-2">
                                            <FollowButton
                                                className="flex-1"
                                                targetUserId={user.id}
                                                initialIsFollowing={initialIsFollowing}
                                            />
                                            <Button
                                                variant="outline"
                                                title="Direct Message"
                                                onClick={async () => {
                                                    const res = await startConversationAction(user.id);
                                                    if (res.success && res.conversation) {
                                                        router.push(`/messages?conversationId=${res.conversation.id}`);
                                                    } else if (res.error) {
                                                        alert(res.error);
                                                    }
                                                }}
                                            >
                                                <MailIcon className="size-4" />
                                            </Button>
                                        </div>
                                        <div className="flex w-full gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 text-xs text-muted-foreground hover:text-destructive"
                                                onClick={async () => {
                                                    if (confirm(`Are you sure you want to block @${user.username}?`)) {
                                                        const { blockUserAction } = await import("@/actions/safety.action");
                                                        const res = await blockUserAction(user.id);
                                                        if (res.success) alert(`Blocked @${user.username}`);
                                                        else alert(res.error || "Failed to block");
                                                    }
                                                }}
                                            >
                                                <BanIcon className="size-3 mr-1" />
                                                Block
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 text-xs text-muted-foreground hover:text-destructive"
                                                onClick={async () => {
                                                    const reason = prompt(`Report @${user.username}. Reason (harassment, spam, etc.):`);
                                                    if (reason) {
                                                        const { createReportAction } = await import("@/actions/safety.action");
                                                        const res = await createReportAction({
                                                            targetType: "USER",
                                                            targetId: user.id,
                                                            reason,
                                                        });
                                                        if (res.success) alert("Report submitted successfully");
                                                        else alert(res.error || "Failed to submit report");
                                                    }
                                                }}
                                            >
                                                <ShieldAlertIcon className="size-3 mr-1" />
                                                Report
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                <div className="w-full mt-6 space-y-3 text-sm text-left">
                                    {user.location && (
                                        <div className="flex items-center text-muted-foreground">
                                            <MapPinIcon className="size-4 mr-2 shrink-0" />
                                            <span className="truncate">{user.location}</span>
                                        </div>
                                    )}
                                    {user.website && (
                                        <div className="flex items-center text-muted-foreground w-full min-w-0">
                                            <LinkIcon className="size-4 mr-2 shrink-0" />
                                            <a
                                                href={
                                                user.website.startsWith("http") ? user.website : `https://${user.website}`
                                                }
                                                className="hover:underline truncate min-w-0 flex-1"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {user.website}
                                            </a>
                                        </div>
                                    )}
                                    <div className="flex items-center text-muted-foreground">
                                        <CalendarIcon className="size-4 mr-2 shrink-0" />
                                        Joined {formattedDate}
                                    </div>

                                    {/* Tech Stack Display */}
                                    {user.techStack && (Array.isArray(user.techStack) ? user.techStack : JSON.parse(user.techStack || '[]')).length > 0 && (
                                        <div className="pt-3 border-t border-border/60 space-y-1.5">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tech Stack</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(Array.isArray(user.techStack) ? user.techStack : JSON.parse(user.techStack || '[]')).map((tech: string, idx: number) => (
                                                    <span key={idx} className="px-2 py-0.5 text-[11px] rounded-md bg-primary/10 text-primary border border-primary/20 font-medium">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Developer Links Display */}
                                    {user.developerLinks && (Array.isArray(user.developerLinks) ? user.developerLinks : JSON.parse(user.developerLinks || '[]')).length > 0 && (
                                        <div className="pt-3 border-t border-border/60 space-y-1.5">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Developer Links</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(Array.isArray(user.developerLinks) ? user.developerLinks : JSON.parse(user.developerLinks || '[]')).map((link: { type: string; url: string; label?: string }, idx: number) => {
                                                    const safeUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;
                                                    return (
                                                        <a
                                                            key={idx}
                                                            href={safeUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium border border-border/50"
                                                        >
                                                            <LinkIcon className="size-3 text-primary" />
                                                            <span className="capitalize">{link.label || link.type}</span>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Badges & Recognitions Display */}
                                    <DeveloperBadgeList
                                        solutionsCount={(user as any).solutionsCount || 0}
                                        isStaffOrAdmin={(user as any).role === "ADMIN"}
                                        hasMilestones={initialMilestones.length > 0}
                                        techStackCount={
                                            user.techStack
                                                ? (Array.isArray(user.techStack)
                                                      ? user.techStack
                                                      : JSON.parse(user.techStack || '[]')
                                                  ).length
                                                : 0
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="w-full min-w-0 flex-1">
                    <Tabs defaultValue="posts" className="w-full">
                        <div className="sticky top-[118px] lg:top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 bg-background/95 backdrop-blur-2xl border-b border-border/70 shadow-sm transition-all">
                            <TabsList className="w-full grid grid-cols-3 h-auto p-1 bg-muted/60 dark:bg-muted/40 rounded-2xl sm:max-w-md">
                                <TabsTrigger
                                    value="posts"
                                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                >
                                    <FileTextIcon className="size-3.5 sm:size-4" />
                                    <span>Posts</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="timeline"
                                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                >
                                    <Milestone className="size-3.5 sm:size-4 shrink-0" />
                                    <span>Timeline</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="likes"
                                    className="flex items-center justify-center gap-1.5 py-2 rounded-xl font-semibold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all"
                                >
                                    <HeartIcon className="size-3.5 sm:size-4" />
                                    <span>Likes</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
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
                        <TabsContent value="timeline" className="mt-6">
                            <DeveloperMilestoneTimeline
                                milestones={initialMilestones}
                                isOwner={currentUser?.id === user.id}
                                username={user.username}
                            />
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
                    onOpenChange={handleOpenChange}
                />
            </div>
        </div>
    );
}

export default ProfilePageClient;