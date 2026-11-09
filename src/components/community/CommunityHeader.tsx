"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { Users, Flame, Shield, Check, UserPlus, Loader2, ArrowLeft, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinCommunityAction, leaveCommunityAction } from "@/actions/community.action";
import { toast } from "@/components/ui/toast";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";
import { format } from "date-fns";

interface CommunityHeaderProps {
  community: CommunityEntity;
}

export function CommunityHeader({ community }: CommunityHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const [isMember, setIsMember] = useState(community.isMember || false);
  const [memberCount, setMemberCount] = useState(community._count?.members || 0);

  const handleToggleJoin = (e: React.MouseEvent) => {
    e.preventDefault();

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
    <div className="w-full rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm mb-6">
      {/* Back button & Banner */}
      <div className="relative h-32 sm:h-44 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/30">
        <Link
          href="/communities"
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 hover:bg-background border border-border/50 text-xs font-medium text-foreground backdrop-blur-sm transition-all shadow-sm"
        >
          <ArrowLeft className="size-3.5" />
          <span>All Guilds</span>
        </Link>
      </div>

      {/* Hero Meta Info */}
      <div className="px-5 sm:px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
          {/* Avatar Icon */}
          <div className="flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-2xl bg-card border-4 border-background text-primary font-bold text-2xl shadow-md overflow-hidden">
            {community.avatarUrl ? (
              <img src={community.avatarUrl} alt={community.name} className="size-full object-cover" />
            ) : (
              <Users className="size-10 text-primary" />
            )}
          </div>

          {/* Action Join Button */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Button
              onClick={handleToggleJoin}
              disabled={isPending}
              variant={isMember ? "outline" : "default"}
              className={`h-9 px-4 text-xs font-semibold transition-all ${
                isMember
                  ? "border-primary/30 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  : "btn-gradient text-white"
              }`}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : isMember ? (
                <>
                  <Check className="size-4 mr-1.5" />
                  Joined Guild
                </>
              ) : (
                <>
                  <UserPlus className="size-4 mr-1.5" />
                  Join Guild
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Title & Slug */}
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {community.name}
            </h1>
            {community.userRole && (
              <span className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Shield className="size-3" />
                <span>{community.userRole}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-mono">/c/{community.slug}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/90 leading-relaxed max-w-2xl mb-4">
          {community.description || "A dedicated developer collective on VibeGrid."}
        </p>

        {/* Tech Stack Chips */}
        {community.techTags && community.techTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {community.techTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary/70 border border-border/40 text-xs text-muted-foreground font-mono"
              >
                #{tag.replace(/^#/, "")}
              </span>
            ))}
          </div>
        )}

        {/* Metrics Row */}
        <div className="flex items-center gap-5 pt-3 border-t border-border/40 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="size-4 text-primary" />
            <span className="text-foreground font-semibold">{memberCount.toLocaleString()}</span> members
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Flame className="size-4 text-amber-500" />
            <span className="text-foreground font-semibold">{(community._count?.posts || 0).toLocaleString()}</span> vibes
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar className="size-4 text-muted-foreground" />
            <span>Founded {format(new Date(community.createdAt), "MMM yyyy")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
