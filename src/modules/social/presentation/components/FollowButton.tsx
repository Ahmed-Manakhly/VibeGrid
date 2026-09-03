"use client";

import { toggleFollow } from "@/actions/user.action";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import toast from "react-hot-toast";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  className?: string;
}

export function FollowButton({ targetUserId, initialIsFollowing, className }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFollowToggle = async () => {
    setIsUpdating(true);
    try {
      await toggleFollow(targetUserId);
      setIsFollowing((prev) => !prev);
      toast.success(isFollowing ? "Unfollowed user" : "Followed user");
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      className={className}
      variant={isFollowing ? "outline" : "default"}
      onClick={handleFollowToggle}
      disabled={isUpdating}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
