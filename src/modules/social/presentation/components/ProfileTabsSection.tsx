"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { InfiniteScroll } from "@/components/InfiniteScroll";
import { FollowButton } from "@/modules/social/presentation/components/FollowButton";
import {
  DeveloperMilestoneTimeline,
  SerializedMilestone,
} from "@/modules/social/presentation/components/DeveloperMilestoneTimeline";
import { FileTextIcon, HeartIcon, Milestone, UserCheck, Users, UserPlus } from "lucide-react";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { cn } from "@/lib/utils";
import { t } from "@/lib/copy";

interface ProfileFollowUser {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  role: string;
  isFollowing: boolean;
}

interface ProfileTabsSectionProps {
  userId: string;
  username: string;
  currentUserId: string | null;
  postsResult: any;
  likedPostsResult: any;
  initialMilestones: SerializedMilestone[];
  userCommunities: any[];
  initialFollowers: ProfileFollowUser[];
  initialFollowing: ProfileFollowUser[];
  followersCount: number;
  followingCount: number;
}

export function ProfileTabsSection({
  userId,
  username,
  currentUserId,
  postsResult,
  likedPostsResult,
  initialMilestones,
  userCommunities,
  initialFollowers,
  initialFollowing,
  followersCount,
  followingCount,
}: ProfileTabsSectionProps) {
  const [activeTab, setActiveTab] = useState("posts");
  const { isVisible: isHeaderVisible } = useScrollDirection();

  return (
    <div className="flex-1 min-w-0 w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div
          className={cn(
            "sticky z-20 bg-background/95 backdrop-blur-md border-b border-border transition-all duration-300 ease-in-out",
            isHeaderVisible ? "top-16" : "top-0",
            "lg:top-16"
          )}
        >
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
            <TabsTrigger
              value="posts"
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
            >
              <FileTextIcon className="size-4 shrink-0" />
              <span>{t("profile.tabs.posts", "Posts")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
            >
              <Milestone className="size-4 shrink-0" />
              <span>{t("profile.tabs.timeline", "Timeline")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
            >
              <HeartIcon className="size-4 shrink-0" />
              <span>{t("profile.tabs.likes", "Likes")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="guilds"
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
            >
              <Users className="size-4 shrink-0" />
              <span>{t("profile.tabs.guilds", "Guilds")} ({userCommunities.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="followers"
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
            >
              <UserCheck className="size-4 shrink-0" />
              <span>{t("profile.tabs.followers", "Followers")} ({followersCount})</span>
            </TabsTrigger>
            <TabsTrigger
              value="following"
              className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
            >
              <UserPlus className="size-4 shrink-0" />
              <span>{t("profile.tabs.following", "Following")} ({followingCount})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="posts" className="mt-6">
          <div className="space-y-6">
            <InfiniteScroll
              initialPosts={postsResult.data}
              initialNextCursor={postsResult.nextCursor}
              apiUrl={`/api/posts?authorId=${userId}`}
              dbUserId={currentUserId}
            />
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <DeveloperMilestoneTimeline
            milestones={initialMilestones}
            isOwner={currentUserId === userId}
            username={username}
          />
        </TabsContent>

        <TabsContent value="likes" className="mt-6">
          <div className="space-y-6">
            <InfiniteScroll
              initialPosts={likedPostsResult.data}
              initialNextCursor={likedPostsResult.nextCursor}
              apiUrl={`/api/posts?likedByUserId=${userId}`}
              dbUserId={currentUserId}
            />
          </div>
        </TabsContent>

        <TabsContent value="guilds" className="mt-6">
          {userCommunities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {t("profile.empty.noGuilds", "No guilds joined yet. Explore the Guilds Directory.")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userCommunities.map((comm) => (
                <div
                  key={comm.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={comm.avatarUrl} name={comm.name} className="size-10 shrink-0" />
                    <div className="min-w-0">
                      <Link
                        href={`/communities/${comm.slug}`}
                        className="font-semibold text-sm hover:underline block truncate"
                      >
                        {comm.name}
                      </Link>
                      <span className="text-xs text-muted-foreground truncate block">
                        /c/{comm.slug}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/communities/${comm.slug}`}
                    className="btn-gradient text-xs px-3 py-1.5 h-8 rounded-lg shrink-0 flex items-center font-mono"
                  >
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
              {t("profile.empty.noFollowers", "No followers yet.")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialFollowers.map((fUser) => (
                <div
                  key={fUser.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={fUser.image} name={fUser.name} className="size-10 shrink-0" />
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${fUser.username}`}
                        className="font-semibold text-sm hover:underline block truncate"
                      >
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
                  {currentUserId !== fUser.id && (
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
              {t("profile.empty.noFollowing", "Not following anyone yet.")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialFollowing.map((fUser) => (
                <div
                  key={fUser.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar src={fUser.image} name={fUser.name} className="size-10 shrink-0" />
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${fUser.username}`}
                        className="font-semibold text-sm hover:underline block truncate"
                      >
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
                  {currentUserId !== fUser.id && (
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
  );
}
