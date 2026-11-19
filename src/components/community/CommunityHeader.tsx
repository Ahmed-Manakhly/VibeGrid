"use client";

import React, { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Flame, Shield, Check, UserPlus, Loader2, ArrowLeft, Calendar, FileText, Trash2, Settings, Camera, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { joinCommunityAction, leaveCommunityAction, deleteCommunityAction, updateCommunityAction } from "@/actions/community.action";
import { CommunitySettingsDialog } from "./CommunitySettingsDialog";
import { useSession } from "@/components/auth/SessionProvider";
import { uploadMediaAsset } from "@/lib/mediaClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";
import { format } from "date-fns";
import { TruncatedLinkifiedText } from "@/components/TruncatedLinkifiedText";

interface CommunityHeaderProps {
  community: CommunityEntity;
  categories?: { id: string; name: string; slug: string; emoji?: string | null }[];
}

export function CommunityHeader({ community, categories = [] }: CommunityHeaderProps) {
  const router = useRouter();
  const { user } = useSession();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMember, setIsMember] = useState(community.isMember || false);
  const [memberCount, setMemberCount] = useState(community._count?.members || 0);
  const [avatarUrl, setAvatarUrl] = useState(community.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(community.bannerUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isCreator = Boolean(user?.id && community.creatorId === user.id);
  const canManage = isCreator || community.userRole === "ADMIN";

  const handleAvatarDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const res = await uploadMediaAsset({ file, purpose: "avatar" });
      setAvatarUrl(res.publicUrl);
      const updateRes = await updateCommunityAction({
        communityId: community.id,
        avatarUrl: res.publicUrl,
      });
      if (updateRes.success) {
        toast.success("Community avatar updated!");
        router.refresh();
      } else {
        toast.error(updateRes.error || "Failed to save avatar update");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleBannerDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBanner(true);
      const res = await uploadMediaAsset({ file, purpose: "post_attachment" });
      setBannerUrl(res.publicUrl);
      const updateRes = await updateCommunityAction({
        communityId: community.id,
        bannerUrl: res.publicUrl,
      });
      if (updateRes.success) {
        toast.success("Community banner updated!");
        router.refresh();
      } else {
        toast.error(updateRes.error || "Failed to save banner update");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload banner");
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleDeleteCommunity = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteCommunityAction(community.id);
      if (res.success) {
        toast.success(`Guild "${community.name}" deleted`);
        router.push("/communities");
      } else {
        toast.error(res.error || "Failed to delete guild");
      }
    } catch {
      toast.error("Failed to delete guild");
    } finally {
      setIsDeleting(false);
    }
  };

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
      <div className="relative h-32 sm:h-48 w-full bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/30 overflow-hidden group">
        {bannerUrl ? (
          <img src={bannerUrl} alt={community.name} className="size-full object-cover" />
        ) : null}

        <Link
          href="/communities"
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 hover:bg-background border border-border/50 text-xs font-medium text-foreground backdrop-blur-sm transition-all shadow-sm"
        >
          <ArrowLeft className="size-3.5" />
          <span>All Guilds</span>
        </Link>

        {/* Change Banner Overlay Button (Visible to Creator / Admin) */}
        {canManage && (
          <>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleBannerDirectUpload}
              disabled={isUploadingBanner}
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
              className="absolute top-11 left-3 sm:top-3 sm:left-auto sm:right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/85 hover:bg-background text-xs font-medium text-foreground backdrop-blur-sm border border-border/60 transition-all shadow-md opacity-90 sm:opacity-80 hover:opacity-100"
            >
              {isUploadingBanner ? (
                <>
                  <Loader2 className="size-3.5 animate-spin text-accent" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="size-3.5 text-accent" />
                  <span>{bannerUrl ? "Change Banner" : "Upload Banner"}</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Hero Meta Info */}
      <div className="px-5 sm:px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
          {/* Avatar Icon with Direct Change on Click */}
          <div className="relative group">
            {canManage && (
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarDirectUpload}
                disabled={isUploadingAvatar}
              />
            )}
            <div
              onClick={() => canManage && !isUploadingAvatar && avatarInputRef.current?.click()}
              className={`flex size-20 sm:size-24 shrink-0 items-center justify-center rounded-2xl bg-card border-4 border-background text-primary font-bold text-2xl shadow-md overflow-hidden relative ${
                canManage ? "cursor-pointer hover:ring-2 hover:ring-primary/60" : ""
              }`}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={community.name} className="size-full object-cover" />
              ) : (
                <Users className="size-10 text-primary" />
              )}

              {/* Direct Click Overlay for Creator/Admin */}
              {canManage && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-semibold">
                  {isUploadingAvatar ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <>
                      <Camera className="size-5 mb-0.5 text-primary" />
                      <span>Change</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Join & Admin Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:self-auto justify-end">
            {canManage && (
              <div className="w-full sm:w-auto">
                <CommunitySettingsDialog community={community} categories={categories} />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {isCreator && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto h-9 px-3 text-xs text-destructive hover:text-destructive/90 border-destructive/30 hover:bg-destructive/10 rounded-xl"
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 mr-1.5" />}
                      Delete Guild
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Guild "{community.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete this guild and remove all member associations. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-none">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteCommunity}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
                      >
                        Confirm Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button
                onClick={handleToggleJoin}
                disabled={isPending}
                variant={isMember ? "outline" : "default"}
                className={`w-full sm:w-auto h-9 px-4 text-xs font-semibold transition-all ${
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
        <div className="max-w-2xl mb-4">
          <TruncatedLinkifiedText
            text={community.description || "A dedicated developer collective on VibeGrid."}
            limit={220}
            className="text-sm text-foreground/90 leading-relaxed break-words"
          />
        </div>

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
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-border/40 text-xs text-muted-foreground">
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
