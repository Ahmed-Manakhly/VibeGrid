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
import { TruncatedLinkifiedText } from "@/components/TruncatedLinkifiedText";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FollowButton } from "@/modules/social/presentation/components/FollowButton";
import { EditProfileModal } from "@/modules/social/presentation/components/EditProfileModal";
import { startConversationAction } from "@/actions/messaging.action";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";
import {
    DeveloperMilestoneTimeline,
    SerializedMilestone,
} from "@/modules/social/presentation/components/DeveloperMilestoneTimeline";
import { DeveloperBadgeList } from "@/modules/social/presentation/components/DeveloperBadgeList";
import { Milestone, UserCheck, Users, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BlockConfirmationDialog } from "@/modules/safety/presentation/components/BlockConfirmationDialog";
import { ReportUserDialog } from "@/modules/safety/presentation/components/ReportUserDialog";
import { toast } from "@/components/ui/toast";

type User = Awaited<ReturnType<typeof getProfileByUsername>>;
type PostsResult = Awaited<ReturnType<typeof getPosts>>;

interface ProfileFollowUser {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    bio: string | null;
    role: string;
    isFollowing: boolean;
}

interface ProfilePageClientProps {
    user: NonNullable<User>;
    postsResult: PostsResult;
    likedPostsResult: PostsResult;
    isFollowing: boolean;
    initialMilestones?: SerializedMilestone[];
    userCommunities?: any[];
    initialFollowers?: ProfileFollowUser[];
    initialFollowing?: ProfileFollowUser[];
}

function ProfilePageClient({
    isFollowing: initialIsFollowing,
    likedPostsResult,
    postsResult,
    user,
    initialMilestones = [],
    userCommunities = [],
    initialFollowers = [],
    initialFollowing = [],
}: ProfilePageClientProps) {
    const { isVisible: isHeaderVisible } = useScrollDirection({ threshold: 12, topOffset: 60 });
    const { user: currentUser, isAuthenticated } = useSession();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const isEditRequested = searchParams.get('edit') === 'true' || searchParams.get('complete') === 'true';
    const [showEditDialog, setShowEditDialog] = useState(isEditRequested);
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [isBlocking, setIsBlocking] = useState(false);

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
            <PageHeader
                eyebrow="DEVELOPER IDENTITY"
                title={user.name ?? user.username}
                subtitle={`@${user.username} • Developer profile, milestones, and contributions.`}
                icon={UserCheck}
                className="mb-6"
            />
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-[350px] shrink-0 relative lg:sticky lg:top-24 z-10">
                    <Card className="bg-card/90 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <UserAvatar src={user.image} name={user.name} className="w-24 h-24" />
                                <h1 className="mt-4 text-2xl font-bold">{user.name ?? user.username}</h1>
                                <p className="text-muted-foreground">@{user.username}</p>
                                {user.bio && (
                                    <div className="mt-2 w-full">
                                        <TruncatedLinkifiedText
                                            text={user.bio}
                                            limit={150}
                                            className="text-sm text-foreground/90 leading-relaxed break-words"
                                        />
                                    </div>
                                )}
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
                                                        toast.error(res.error);
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
                                                onClick={() => setShowBlockDialog(true)}
                                            >
                                                <BanIcon className="size-3 mr-1" />
                                                Block
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 text-xs text-muted-foreground hover:text-destructive"
                                                onClick={() => setShowReportDialog(true)}
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
                        <div className={cn(
                            "sticky z-30 py-1 bg-transparent backdrop-blur-md mb-4 transition-[top] duration-300 ease-out will-change-[top]",
                            isHeaderVisible ? "top-16" : "top-0 lg:top-16"
                        )}>
                            <TabsList className="w-full flex items-center justify-start flex-wrap border-b border-border/50 bg-transparent p-0 rounded-none h-auto gap-x-4 sm:gap-x-6 gap-y-1">
                                <TabsTrigger
                                    value="posts"
                                    className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                                >
                                    <FileTextIcon className="size-4 shrink-0" />
                                    <span>Posts</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="timeline"
                                    className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                                >
                                    <Milestone className="size-4 shrink-0" />
                                    <span>Timeline</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="likes"
                                    className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                                >
                                    <HeartIcon className="size-4 shrink-0" />
                                    <span>Likes</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="guilds"
                                    className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                                >
                                    <Users className="size-4 shrink-0" />
                                    <span>Guilds ({userCommunities.length})</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="followers"
                                    className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                                >
                                    <UserCheck className="size-4 shrink-0" />
                                    <span>Followers ({user._count.followers})</span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="following"
                                    className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
                                >
                                    <UserPlus className="size-4 shrink-0" />
                                    <span>Following ({user._count.following})</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="posts" className="mt-6">
                            <div className="space-y-6">
                                <InfiniteScroll 
                                    initialPosts={postsResult.data}
                                    initialNextCursor={postsResult.nextCursor}
                                    apiUrl={`/api/posts?authorId=${user.id}`}
                                    dbUserId={currentUser?.id || null}
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
                                    dbUserId={currentUser?.id || null}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="guilds" className="mt-6">
                            {userCommunities.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-sm">
                                    No guilds joined yet. Explore the <Link href="/communities" className="text-primary hover:underline">Guilds Directory</Link>.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {userCommunities.map((comm) => (
                                        <div key={comm.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <UserAvatar src={comm.avatarUrl} name={comm.name} className="size-10 shrink-0" />
                                                <div className="min-w-0">
                                                    <Link href={`/communities/${comm.slug}`} className="font-semibold text-sm hover:underline block truncate">
                                                        {comm.name}
                                                    </Link>
                                                    <span className="text-xs text-muted-foreground truncate block">
                                                        {comm._count?.members || 1} members
                                                    </span>
                                                </div>
                                            </div>
                                            <Link href={`/communities/${comm.slug}`} className="btn-gradient text-xs px-3 py-1.5 rounded-lg shrink-0">
                                                View
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="followers" className="mt-6">
                            {initialFollowers.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-sm">
                                    No followers yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {initialFollowers.map((fUser) => (
                                        <div key={fUser.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <UserAvatar src={fUser.image} name={fUser.name} className="size-10 shrink-0" />
                                                <div className="min-w-0">
                                                    <Link href={`/profile/${fUser.username}`} className="font-semibold text-sm hover:underline block truncate">
                                                        {fUser.name || fUser.username}
                                                    </Link>
                                                    <span className="text-xs text-muted-foreground truncate block">
                                                        @{fUser.username}
                                                    </span>
                                                    {fUser.bio && (
                                                        <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                                                            {fUser.bio}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {currentUser?.id !== fUser.id && (
                                                <FollowButton
                                                    targetUserId={fUser.id}
                                                    initialIsFollowing={fUser.isFollowing}
                                                    className="btn-gradient text-xs px-3 py-1.5 h-8 rounded-lg shrink-0 font-mono"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="following" className="mt-6">
                            {initialFollowing.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-sm">
                                    Not following anyone yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {initialFollowing.map((fUser) => (
                                        <div key={fUser.id} className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <UserAvatar src={fUser.image} name={fUser.name} className="size-10 shrink-0" />
                                                <div className="min-w-0">
                                                    <Link href={`/profile/${fUser.username}`} className="font-semibold text-sm hover:underline block truncate">
                                                        {fUser.name || fUser.username}
                                                    </Link>
                                                    <span className="text-xs text-muted-foreground truncate block">
                                                        @{fUser.username}
                                                    </span>
                                                    {fUser.bio && (
                                                        <p className="text-xs text-muted-foreground/80 truncate mt-0.5">
                                                            {fUser.bio}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {currentUser?.id !== fUser.id && (
                                                <FollowButton
                                                    targetUserId={fUser.id}
                                                    initialIsFollowing={fUser.isFollowing}
                                                    className="btn-gradient text-xs px-3 py-1.5 h-8 rounded-lg shrink-0 font-mono"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                <EditProfileModal
                    user={user}
                    open={showEditDialog}
                    onOpenChange={handleOpenChange}
                />

                <BlockConfirmationDialog
                    open={showBlockDialog}
                    onOpenChange={setShowBlockDialog}
                    username={user.username}
                    isPending={isBlocking}
                    onConfirm={async () => {
                        try {
                            setIsBlocking(true);
                            const { blockUserAction } = await import("@/actions/safety.action");
                            const res = await blockUserAction(user.id);
                            if (res.success) {
                                const evMsg = res.evictedCommunitiesCount && res.evictedCommunitiesCount > 0
                                    ? ` and automatically exited ${res.evictedCommunitiesCount} of their guilds`
                                    : "";
                                toast.success(`Blocked @${user.username}${evMsg}`);
                                setShowBlockDialog(false);
                                router.push("/?blocked=true");
                            } else {
                                toast.error(res.error || "Failed to block user");
                            }
                        } catch {
                            toast.error("Failed to block user");
                        } finally {
                            setIsBlocking(false);
                        }
                    }}
                />
                <ReportUserDialog
                    open={showReportDialog}
                    onOpenChange={setShowReportDialog}
                    targetUserId={user.id}
                    username={user.username}
                />
            </div>
        </div>
    );
}

export default ProfilePageClient;