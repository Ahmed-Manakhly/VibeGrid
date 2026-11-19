"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Users, Flame, Shield, Check, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinCommunityAction, leaveCommunityAction } from "@/actions/community.action";
import { toast } from "@/components/ui/toast";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";
import { TruncatedLinkifiedText } from "@/components/TruncatedLinkifiedText";

interface CommunityCardProps {
  community: CommunityEntity;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isMember, setIsMember] = useState(community.isMember || false);
  const [memberCount, setMemberCount] = useState(community._count?.members || 0);

  const handleToggleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isMember;
    setIsMember(nextState);
    setMemberCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    startTransition(async () => {
      if (nextState) {
        const res = await joinCommunityAction(community.id, community.slug);
        if (!res.success) {
          setIsMember(!nextState);
          setMemberCount((prev) => prev - 1);
          toast.error(res.error || "Failed to join community");
        } else {
          toast.success(`Joined ${community.name}`);
        }
      } else {
        const res = await leaveCommunityAction(community.id, community.slug);
        if (!res.success) {
          setIsMember(!nextState);
          setMemberCount((prev) => prev + 1);
          toast.error(res.error || "Failed to leave community");
        } else {
          toast.info(`Left ${community.name}`);
        }
      }
    });
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md">
      {/* Top Banner Gradient & Badge */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-lg overflow-hidden">
              {community.avatarUrl ? (
                <img src={community.avatarUrl} alt={community.name} className="size-full object-cover" />
              ) : (
                <Users className="size-6 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/communities/${community.slug}`}
                className="font-semibold text-foreground group-hover:text-primary transition-colors text-base hover:underline block break-words"
              >
                {community.name}
              </Link>
              <div className="text-xs text-muted-foreground font-mono truncate">
                /c/{community.slug}
              </div>
            </div>
          </div>

          {/* Join/Leave Button */}
          <Button
            size="sm"
            variant={isMember ? "outline" : "default"}
            onClick={handleToggleJoin}
            disabled={isPending}
            className={`h-8 px-3 text-xs font-medium transition-all shrink-0 self-start sm:self-auto ${
              isMember
                ? "border-primary/30 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                : "btn-gradient text-white"
            }`}
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : isMember ? (
              <span className="flex items-center gap-1">
                <Check className="size-3.5" />
                <span>Joined</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <UserPlus className="size-3.5" />
                <span>Join</span>
              </span>
            )}
          </Button>
        </div>

        {/* Description */}
        <div className="mb-4">
          <TruncatedLinkifiedText
            text={community.description || "A collaborative developer hub on VibeGrid."}
            limit={120}
            className="text-sm text-muted-foreground leading-relaxed break-words"
          />
        </div>

        {/* Tech Stack Tags */}
        {community.techTags && community.techTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {community.techTags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40 text-xs text-muted-foreground font-mono"
              >
                #{tag.replace(/^#/, "")}
              </span>
            ))}
            {community.techTags.length > 4 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-secondary/40 text-xs text-muted-foreground font-mono">
                +{community.techTags.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Metrics Footer */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5 font-medium">
            <Users className="size-3.5 text-primary/80" />
            <span>{memberCount.toLocaleString()} {memberCount === 1 ? "member" : "members"}</span>
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Flame className="size-3.5 text-amber-500/80" />
            <span>{(community._count?.posts || 0).toLocaleString()} vibes</span>
          </span>
        </div>

        {community.userRole && (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Shield className="size-3" />
            <span>{community.userRole}</span>
          </span>
        )}
      </div>
    </div>
  );
}
