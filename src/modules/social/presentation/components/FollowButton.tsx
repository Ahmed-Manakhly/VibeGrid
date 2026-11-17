"use client";

import { toggleFollow } from "@/actions/user.action";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/components/ui/toast";

interface FollowButtonProps {
  targetUserId?: string;
  userId?: string;
  initialIsFollowing?: boolean;
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ targetUserId, userId, initialIsFollowing = false, className, onFollowChange }: FollowButtonProps) {
  const effectiveUserId = targetUserId || userId;
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFollowToggle = async () => {
    if (!effectiveUserId) return;
    setIsUpdating(true);
    try {
      await toggleFollow(effectiveUserId);
      const nextState = !isFollowing;
      setIsFollowing(nextState);
      if (onFollowChange) {
        onFollowChange(nextState);
      }
      toast.success(nextState ? "Tuned in to developer" : "Tuned out");
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getButtonContent = () => {
    if (!isFollowing) return "Tune In";
    return isHovered ? "Tune Out" : "Tuned In";
  };

  return (
    <Button
      className={
        isFollowing
          ? `w-20 rounded-xl font-mono text-xs transition-colors border border-border/60 ${
              isHovered
                ? "bg-destructive/15 text-destructive border-destructive/40 hover:bg-destructive/20 hover:text-destructive"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            } ${className || ""}`
          : className || "btn-gradient w-20 rounded-xl font-mono text-xs"
      }
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleFollowToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isUpdating}
    >
      {getButtonContent()}
    </Button>
  );
}

export default FollowButton;

