"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Shield } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { FollowButton } from "@/modules/social/presentation/components/FollowButton";
import { CommunityMemberEntity } from "@/modules/community/domain/ICommunityRepository";

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
  // Filter out current viewer
  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  if (otherMembers.length === 0) return null;

  return (
    <Card className="rounded-xl border bg-card/30 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="font-mono tracking-widest text-muted-foreground uppercase text-xs flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5 text-primary" />
            <span>Members to Tune In</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary font-mono text-muted-foreground">
            {members.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {otherMembers.slice(0, 5).map((member) => {
            const displayName = member.user?.name || member.user?.username || "Developer";
            return (
              <div key={member.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Link href={`/profile/${member.user?.username || member.userId}`}>
                    <UserAvatar
                      src={member.user?.image}
                      name={displayName}
                      className="size-8 transition-transform hover:scale-105"
                    />
                  </Link>
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

                <FollowButton
                  targetUserId={member.userId}
                  className="h-7 px-2.5 text-xs rounded-lg shrink-0"
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
