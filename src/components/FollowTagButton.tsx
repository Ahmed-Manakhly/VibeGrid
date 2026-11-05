"use client";

import React, { useState, useTransition } from "react";
import { toggleFollowTag } from "@/actions/taxonomy.action";
import { toast } from "@/components/ui/toast";
import { Plus, Check, Loader2 } from "lucide-react";

interface FollowTagButtonProps {
  tagId: string;
  tagName: string;
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
  variant?: "pill" | "button" | "compact";
  className?: string;
}

export function FollowTagButton({
  tagId,
  tagName,
  initialIsFollowing = false,
  initialFollowersCount = 0,
  variant = "button",
  className = "",
}: FollowTagButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic toggle
    const nextFollowing = !isFollowing;
    const nextCount = nextFollowing ? followersCount + 1 : Math.max(0, followersCount - 1);
    setIsFollowing(nextFollowing);
    setFollowersCount(nextCount);

    startTransition(async () => {
      const res = await toggleFollowTag(tagId);
      if (!res.success) {
        // Rollback
        setIsFollowing(!nextFollowing);
        setFollowersCount(followersCount);
        toast.error(res.error || "Failed to update followed technology.");
      } else {
        if (res.isFollowing !== undefined) setIsFollowing(res.isFollowing);
        if (res.followersCount !== undefined) setFollowersCount(res.followersCount);
        toast.success(
          nextFollowing
            ? `Subscribed to #${tagName} pulse`
            : `Unsubscribed from #${tagName}`
        );
      }
    });
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono transition-all duration-200 ${
          isFollowing
            ? "bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30"
            : "bg-muted/40 text-muted-foreground border border-border/40 hover:border-border hover:text-foreground"
        } ${className}`}
        aria-label={`${isFollowing ? "Unfollow" : "Follow"} #${tagName}`}
      >
        {isPending ? (
          <Loader2 className="size-3 animate-spin" />
        ) : isFollowing ? (
          <Check className="size-3" />
        ) : (
          <Plus className="size-3" />
        )}
        <span>#{tagName}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-semibold transition-all duration-200 ${
        isFollowing
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : "bg-card/80 text-foreground border border-border/80 hover:bg-accent/10 hover:border-accent/40"
      } ${className}`}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isFollowing ? (
        <Check className="size-3.5" />
      ) : (
        <Plus className="size-3.5" />
      )}
      <span>{isFollowing ? "Following" : "Follow"}</span>
      {followersCount > 0 && (
        <span className="text-[10px] opacity-75 ml-0.5">({followersCount})</span>
      )}
    </button>
  );
}
