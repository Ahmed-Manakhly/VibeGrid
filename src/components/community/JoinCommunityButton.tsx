"use client";

import React, { useState, useTransition } from "react";
import { Check, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinCommunityAction, leaveCommunityAction } from "@/actions/community.action";
import { toast } from "@/components/ui/toast";
import { t } from "@/lib/copy";

interface JoinCommunityButtonProps {
  communityId: string;
  communitySlug: string;
  initialIsMember: boolean;
  onMembershipChange?: (newIsMember: boolean) => void;
  className?: string;
}

export function JoinCommunityButton({
  communityId,
  communitySlug,
  initialIsMember,
  onMembershipChange,
  className,
}: JoinCommunityButtonProps) {
  const [isMember, setIsMember] = useState(initialIsMember);
  const [isPending, startTransition] = useTransition();

  const handleToggleJoin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      try {
        if (isMember) {
          const res = await leaveCommunityAction(communityId, communitySlug);
          if (res.success) {
            setIsMember(false);
            if (onMembershipChange) onMembershipChange(false);
            toast.success("Left community");
          } else {
            toast.error(res.error || "Failed to leave community");
          }
        } else {
          const res = await joinCommunityAction(communityId, communitySlug);
          if (res.success) {
            setIsMember(true);
            if (onMembershipChange) onMembershipChange(true);
            toast.success("Joined community");
          } else {
            toast.error(res.error || "Failed to join community");
          }
        }
      } catch {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <Button
      size="sm"
      variant={isMember ? "outline" : "default"}
      onClick={handleToggleJoin}
      disabled={isPending}
      className={`h-8 px-3 text-xs font-medium transition-all shrink-0 self-start sm:self-auto ${
        isMember
          ? "border-primary/30 text-primary hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          : "btn-gradient text-white"
      } ${className || ""}`}
    >
      {isPending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isMember ? (
        <span className="flex items-center gap-1">
          <Check className="size-3.5" />
          <span>{t("communities.actions.joined")}</span>
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <UserPlus className="size-3.5" />
          <span>{t("communities.actions.join")}</span>
        </span>
      )}
    </Button>
  );
}
