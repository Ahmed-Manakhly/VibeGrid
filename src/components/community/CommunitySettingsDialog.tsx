"use client";

import React, { useState, useTransition } from "react";
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
import { Settings, Loader2, Sparkles, Shield, Image as ImageIcon } from "lucide-react";
import { updateCommunityAction } from "@/actions/community.action";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";

interface CommunitySettingsDialogProps {
  community: CommunityEntity;
}

export function CommunitySettingsDialog({ community }: CommunitySettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description || "");
  const [avatarUrl, setAvatarUrl] = useState(community.avatarUrl || "");
  const [bannerUrl, setBannerUrl] = useState(community.bannerUrl || "");
  const [techTagsInput, setTechTagsInput] = useState(
    Array.isArray(community.techTags) ? community.techTags.join(", ") : ""
  );
  const [rulesInput, setRulesInput] = useState(
    Array.isArray(community.rules) ? community.rules.join("\n") : ""
  );
  const [isPrivate, setIsPrivate] = useState(community.isPrivate || false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ImageIcon className="size-3.5 text-primary" />
                <span>Avatar / Logo Image URL</span>
              </label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <ImageIcon className="size-3.5 text-accent" />
                <span>Banner Cover Image URL</span>
              </label>
              <Input
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

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

