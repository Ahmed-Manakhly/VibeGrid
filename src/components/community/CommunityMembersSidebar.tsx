"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Shield, MessageSquare, Radio } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { FollowButton } from "@/modules/social/presentation/components/FollowButton";
import { Button } from "@/components/ui/button";
import { CommunityMemberEntity } from "@/modules/community/domain/ICommunityRepository";
import { getUserFollowingAction } from "@/actions/profile.action";
import { startConversationAction } from "@/actions/messaging.action";
import { useRealtime } from "@/shared/infrastructure/socket/RealtimeProvider";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

interface CommunityMembersSidebarProps {
  communityName: string;
  members: CommunityMemberEntity[];
  currentUserId?: string | null;
}

export function CommunityMembersSidebar({
  communityName,
  members,
  currentUserId,
}: CommunityMembersSidebarProps) {
  const router = useRouter();
  const { onlineUsers } = useRealtime();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [startingChatUserId, setStartingChatUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) {
      setIsLoaded(true);
      return;
    }

    getUserFollowingAction(currentUserId)
      .then((res) => {
        if (res.success && res.data) {
          const ids = new Set(res.data.map((u: any) => u.id));
          setFollowingIds(ids);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, [currentUserId]);

  const handleFastPassChat = async (targetUserId: string) => {
    if (!currentUserId) {
      router.push("/sign-in");
      return;
    }
    setStartingChatUserId(targetUserId);
    const res = await startConversationAction(targetUserId);
    setStartingChatUserId(null);

    if (res.success && res.conversation) {
      router.push(`/messages?conversationId=${res.conversation.id}`);
    } else {
      toast.error(res.error || "Could not open direct chat");
    }
  };

  // Exclude current viewer
  const candidateMembers = members.filter((m) => m.userId !== currentUserId);

  if (!isLoaded || candidateMembers.length === 0) return null;

  // Split into Online Co-Members vs General Members
  const onlineMembers = candidateMembers.filter((m) => onlineUsers.has(m.userId));
  const displayMembers = onlineMembers.length > 0 ? onlineMembers : candidateMembers;

  return (
    <Card className="rounded-xl border bg-card/30 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono tracking-widest text-muted-foreground uppercase text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Radio className="size-3.5 text-emerald-500 animate-pulse" />
            <span>{onlineMembers.length > 0 ? "Online Guild Members" : "Guild Members"}</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary font-mono text-muted-foreground">
            {displayMembers.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {displayMembers.slice(0, 6).map((member) => {
            const displayName = member.user?.name || member.user?.username || "Developer";
            const isOnline = onlineUsers.has(member.userId);
            const isFollowing = followingIds.has(member.userId);

            return (
              <div key={member.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-secondary/20 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <Link href={`/profile/${member.user?.username || member.userId}`}>
                      <UserAvatar
                        src={member.user?.image}
                        name={displayName}
                        className="size-8 transition-transform hover:scale-105"
                      />
                    </Link>
                    {isOnline && (
                      <span className="absolute top-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background shadow-sm" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${member.user?.username || member.userId}`}
                      className="text-xs font-semibold text-foreground truncate block hover:underline hover:text-primary transition-colors"
                    >
                      {displayName}
                    </Link>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground truncate font-mono">
                        @{member.user?.username || "dev"}
                      </span>
                      {member.role === "ADMIN" && (
                        <span className="text-[9px] px-1 rounded bg-brand-gold/15 text-brand-gold font-mono font-bold">
                          Admin
                        </span>
                      )}
                      {member.role === "MODERATOR" && (
                        <span className="text-[9px] px-1 rounded bg-primary/15 text-primary font-mono font-bold">
                          Mod
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                  {/* 1-Click Fast-Pass Direct Chat */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onClick={() => handleFastPassChat(member.userId)}
                    disabled={startingChatUserId === member.userId}
                    title="Direct Message co-member"
                  >
                    <MessageSquare className="size-3.5" />
                  </Button>

                  {!isFollowing && (
                    <FollowButton
                      targetUserId={member.userId}
                      className="h-7 px-2 text-[11px] rounded-lg shrink-0"
                      onFollowChange={(nextFollowing) => {
                        if (nextFollowing) {
                          setFollowingIds((prev) => new Set(prev).add(member.userId));
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
