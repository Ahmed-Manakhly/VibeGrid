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
      toast.success(nextState ? "Followed user" : "Unfollowed user");
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      className={className || "btn-gradient w-20 rounded-xl font-mono text-xs"}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      onClick={handleFollowToggle}
      disabled={isUpdating}
    >
      {isFollowing ? "Following" : "Tune In"}
    </Button>
  );
}

export default FollowButton;
