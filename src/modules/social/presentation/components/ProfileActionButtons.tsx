"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/modules/social/presentation/components/FollowButton";
import { EditProfileModal } from "@/modules/social/presentation/components/EditProfileModal";
import { BlockConfirmationDialog } from "@/modules/safety/presentation/components/BlockConfirmationDialog";
import { ReportUserDialog } from "@/modules/safety/presentation/components/ReportUserDialog";
import { startConversationAction } from "@/actions/messaging.action";
import { toast } from "@/components/ui/toast";
import { EditIcon, MailIcon, BanIcon, ShieldAlertIcon } from "lucide-react";

interface ProfileActionButtonsProps {
  user: {
    id: string;
    username: string;
    name?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    developerLinks?: any;
    techStack?: any;
    image?: string | null;
  };
  currentUserId: string | null;
  isAuthenticated: boolean;
  initialIsFollowing: boolean;
}

export function ProfileActionButtons({
  user,
  currentUserId,
  isAuthenticated,
  initialIsFollowing,
}: ProfileActionButtonsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditRequested = searchParams.get("edit") === "true" || searchParams.get("complete") === "true";

  const [showEditDialog, setShowEditDialog] = useState(isEditRequested);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (isEditRequested) {
      setShowEditDialog(true);
    }
  }, [isEditRequested]);

  const handleOpenChange = (open: boolean) => {
    setShowEditDialog(open);
    if (!open && isEditRequested) {
      const url = new URL(window.location.href);
      url.searchParams.delete("edit");
      url.searchParams.delete("complete");
      router.replace(url.pathname, { scroll: false });
    }
  };

  const handleBlockSuccess = () => {
    setIsBlocking(true);
    window.location.href = "/";
  };

  const isOwnProfile = currentUserId === user.id;

  if (!isAuthenticated) {
    return (
      <Button className="w-full mt-4" asChild>
        <Link href="/login">Follow</Link>
      </Button>
    );
  }

  if (isOwnProfile) {
    return (
      <>
        <Button className="w-full mt-4" onClick={() => setShowEditDialog(true)}>
          <EditIcon className="size-4 mr-2" />
          Edit Profile
        </Button>
        <EditProfileModal
          user={user as any}
          open={showEditDialog}
          onOpenChange={handleOpenChange}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col w-full gap-2 mt-4">
        <div className="flex w-full gap-2">
          <FollowButton
            className="flex-1"
            targetUserId={user.id}
            initialIsFollowing={initialIsFollowing}
          />
          <Button
            variant="outline"
            title="Direct Message"
            onClick={async () => {
              const res = await startConversationAction(user.id);
              if (res.success && res.conversation) {
                router.push(`/messages?conversationId=${res.conversation.id}`);
              } else if (res.error) {
                toast.error(res.error);
              }
            }}
          >
            <MailIcon className="size-4" />
          </Button>
        </div>
        <div className="flex w-full gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => setShowBlockDialog(true)}
          >
            <BanIcon className="size-3 mr-1" />
            Block
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => setShowReportDialog(true)}
          >
            <ShieldAlertIcon className="size-3 mr-1" />
            Report
          </Button>
        </div>
      </div>

      <BlockConfirmationDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        username={user.username}
        isPending={isBlocking}
        onConfirm={async () => {
          try {
            setIsBlocking(true);
            const { blockUserAction } = await import("@/actions/safety.action");
            const res = await blockUserAction(user.id);
            if (res.success) {
              const evMsg =
                res.evictedCommunitiesCount && res.evictedCommunitiesCount > 0
                  ? ` and automatically exited ${res.evictedCommunitiesCount} of their guilds`
                  : "";
              toast.success(`Blocked @${user.username}${evMsg}`);
              setShowBlockDialog(false);
              window.location.href = "/?blocked=true";
            } else {
              toast.error(res.error || "Failed to block user");
            }
          } catch {
            toast.error("Failed to block user");
          } finally {
            setIsBlocking(false);
          }
        }}
      />

      <ReportUserDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        targetUserId={user.id}
        username={user.username}
      />
    </>
  );
}
