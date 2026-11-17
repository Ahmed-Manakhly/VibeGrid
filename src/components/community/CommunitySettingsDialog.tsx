"use client";

import React, { useState, useTransition, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Loader2, Sparkles, Shield, Image as ImageIcon, UploadCloud, X, Users } from "lucide-react";
import { updateCommunityAction } from "@/actions/community.action";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";
import { uploadMediaAsset } from "@/lib/mediaClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryTaxonomy {
  id: string;
  name: string;
  slug: string;
  emoji?: string | null;
}

interface CommunitySettingsDialogProps {
  community: CommunityEntity;
  categories?: CategoryTaxonomy[];
}

export function CommunitySettingsDialog({ community, categories = [] }: CommunitySettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || "");
  const [avatarUrl, setAvatarUrl] = useState(community.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(community.bannerUrl || "");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [techTagsInput, setTechTagsInput] = useState(
    Array.isArray(community.techTags) ? community.techTags.join(", ") : ""
  );
  const [rulesInput, setRulesInput] = useState(
    Array.isArray(community.rules) ? community.rules.join("\n") : ""
  );
  const [isPrivate, setIsPrivate] = useState(community.isPrivate || false);
  const [isPending, startTransition] = useTransition();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Initialize selectedCategorySlug if any techTag matches a known category slug
  React.useEffect(() => {
    if (Array.isArray(community.techTags) && categories && categories.length > 0) {
      const match = categories.find((cat) =>
        community.techTags?.some(
          (t) => t.toLowerCase().replace(/^#/, "") === cat.slug.toLowerCase()
        )
      );
      if (match) setSelectedCategorySlug(match.slug.toLowerCase());
    }
  }, [community.techTags, categories]);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingAvatar(true);
      const res = await uploadMediaAsset({ file, purpose: 'avatar' });
      setAvatarUrl(res.publicUrl);
      toast.success("Community avatar uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBanner(true);
      const res = await uploadMediaAsset({ file, purpose: 'post_attachment' });
      setBannerUrl(res.publicUrl);
      toast.success("Community banner uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload banner");
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Community name is required");
      return;
    }

    const techTags = techTagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
      .filter(Boolean);

    if (selectedCategorySlug && !techTags.includes(selectedCategorySlug.toLowerCase())) {
      techTags.unshift(selectedCategorySlug.toLowerCase());
    }

    const rules = rulesInput
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await updateCommunityAction({
        communityId: community.id,
        name: name.trim(),
        description: description.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
        techTags,
        rules,
        isPrivate,
      });

      if (res.success) {
        toast.success("Guild settings updated successfully");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update guild settings");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 font-medium border-border/70 hover:bg-accent/15">
          <Settings className="size-4 text-muted-foreground" />
          <span>Guild Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Shield className="size-5 text-primary" />
            <span>Guild Administration & Rules</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Guild Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rust Systems Engineers"
              maxLength={60}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description / Mission
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this developer guild unique?"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Community Visual Identity (Avatar & Banner Uploaders) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Guild Avatar */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-primary" />
                  <span>Guild Avatar / Logo</span>
                </span>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="text-[11px] text-destructive hover:underline flex items-center gap-0.5"
                  >
                    <X className="size-3" /> Remove
                  </button>
                )}
              </label>

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarFile}
                disabled={isUploadingAvatar}
              />

              <div
                onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center h-28 rounded-xl border border-dashed border-border/70 hover:border-primary/60 bg-muted/20 hover:bg-muted/30 cursor-pointer transition-all overflow-hidden p-2 text-center"
              >
                {avatarUrl ? (
                  <div className="relative size-20 rounded-xl overflow-hidden border border-border/80 shadow-inner">
                    <img src={avatarUrl} alt="Guild avatar" className="size-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-medium">
                      <UploadCloud className="size-4 mb-0.5" />
                      <span>Change</span>
                    </div>
                  </div>
                ) : isUploadingAvatar ? (
                  <div className="flex flex-col items-center gap-1.5 text-primary">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-xs">Uploading avatar...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Users className="size-5" />
                    </div>
                    <span className="text-xs font-medium">Click to upload avatar</span>
                    <span className="text-[10px] text-muted-foreground/80">JPG, PNG, WebP (Max 10MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Guild Banner Cover */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-accent" />
                  <span>Banner Cover Image</span>
                </span>
                {bannerUrl && (
                  <button
                    type="button"
                    onClick={() => setBannerUrl("")}
                    className="text-[11px] text-destructive hover:underline flex items-center gap-0.5"
                  >
                    <X className="size-3" /> Remove
                  </button>
                )}
              </label>

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleBannerFile}
                disabled={isUploadingBanner}
              />

              <div
                onClick={() => !isUploadingBanner && bannerInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center h-28 rounded-xl border border-dashed border-border/70 hover:border-accent/60 bg-muted/20 hover:bg-muted/30 cursor-pointer transition-all overflow-hidden text-center"
              >
                {bannerUrl ? (
                  <div className="relative size-full">
                    <img src={bannerUrl} alt="Guild banner" className="size-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[10px] font-medium">
                      <UploadCloud className="size-4 mb-0.5" />
                      <span>Change Cover</span>
                    </div>
                  </div>
                ) : isUploadingBanner ? (
                  <div className="flex flex-col items-center gap-1.5 text-accent">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-xs">Uploading banner...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-accent transition-colors">
                    <div className="size-9 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                      <UploadCloud className="size-5" />
                    </div>
                    <span className="text-xs font-medium">Click to upload banner cover</span>
                    <span className="text-[10px] text-muted-foreground/80">Wide header (Max 10MB)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Category Selector */}
          {categories && categories.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="size-3.5 text-primary" />
                <span>Primary Category (Optional)</span>
              </label>
              <Select
                value={selectedCategorySlug || "none"}
                onValueChange={(val) => setSelectedCategorySlug(val === "none" ? "" : val)}
              >
                <SelectTrigger className="w-full h-9 rounded-lg border-border/60 bg-secondary/40 text-xs text-foreground">
                  <SelectValue placeholder="Select Category (Optional)" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60 max-h-60">
                  <SelectItem value="none" className="text-xs text-muted-foreground">
                    None (Tags only)
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug.toLowerCase()} className="text-xs">
                      {cat.emoji ? `${cat.emoji} ` : ""}{cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Tech Tags (comma separated)</span>
            </label>
            <Input
              value={techTagsInput}
              onChange={(e) => setTechTagsInput(e.target.value)}
              placeholder="rust, wasm, systems, linux"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Guild Code of Conduct & Rules (one per line)
            </label>
            <Textarea
              value={rulesInput}
              onChange={(e) => setRulesInput(e.target.value)}
              placeholder={"1. Share reproducible code.\n2. Constructive code reviews only.\n3. Zero spam."}
              rows={3}
            />
          </div>

          <div className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Private Guild Membership</p>
              <p className="text-xs text-muted-foreground">Require admin approval before new developers can join</p>
            </div>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()} className="gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

