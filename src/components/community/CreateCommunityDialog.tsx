"use client";

import React, { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Sparkles, Hash } from "lucide-react";
import { createCommunityAction } from "@/actions/community.action";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";
import { t } from "@/lib/copy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateCommunityDialogProps {
  categories?: { id: string; name: string; slug: string; emoji?: string | null }[];
}

export function CreateCommunityDialog({ categories = [] }: CreateCommunityDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("");
  const [techTagsInput, setTechTagsInput] = useState("");
  const [rulesInput, setRulesInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9_-]/g, "-")) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
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
      const res = await createCommunityAction({
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
        techTags,
        rules,
      });

      if (!res.success || !res.data) {
        toast.error(res.error || "Failed to create community");
      } else {
        toast.success(`Community "${name}" created!`);
        setOpen(false);
        setName("");
        setSlug("");
        setDescription("");
        setTechTagsInput("");
        setRulesInput("");
        router.push(`/communities/${res.data.slug}`);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-gradient text-white flex items-center gap-1.5 h-9 px-4 text-sm font-medium shadow-sm">
          <Plus className="size-4" />
          <span>{t("communities.createDialog.button")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto bg-card/95 border-border/60 backdrop-blur-md p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="size-5 text-primary" />
            <span>{t("communities.createDialog.title")}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("communities.createDialog.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Guild Name <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Frontend Architects"
              className="bg-secondary/40 border-border/60"
              maxLength={60}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Custom Slug <span className="text-muted-foreground font-normal">(/communities/[slug])</span>
            </label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
              placeholder="frontend-architects"
              className="bg-secondary/40 border-border/60 font-mono text-xs"
              maxLength={40}
            />
          </div>

          {/* Category Selector */}
          {categories && categories.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">
                Primary Category
              </label>
              <Select
                value={selectedCategorySlug || "none"}
                onValueChange={(val) => setSelectedCategorySlug(val === "none" ? "" : val)}
              >
                <SelectTrigger className="w-full h-9 rounded-lg border-border/60 bg-secondary/40 text-xs text-foreground">
                  <SelectValue placeholder="Select Category (Optional)" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60 backdrop-blur-md">
                  <SelectItem value="none" className="text-xs">
                    -- None (Optional) --
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug} className="text-xs">
                      {cat.emoji ? cat.emoji + " " : ""}{cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the focus of this developer community?"
              rows={3}
              className="bg-secondary/40 border-border/60 text-sm resize-none"
              maxLength={280}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
              <Hash className="size-3.5 text-primary" />
              <span>Tech Tags (comma separated)</span>
            </label>
            <Input
              value={techTagsInput}
              onChange={(e) => setTechTagsInput(e.target.value)}
              placeholder="react, typescript, nextjs, architecture"
              className="bg-secondary/40 border-border/60 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">
              Guild Rules (one per line)
            </label>
            <Textarea
              value={rulesInput}
              onChange={(e) => setRulesInput(e.target.value)}
              placeholder="1. Constructive code reviews only&#10;2. Share real production learnings"
              rows={2}
              className="bg-secondary/40 border-border/60 text-xs font-mono resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !name.trim()}
              className="btn-gradient text-white text-xs h-9 px-4 font-semibold"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Creating...
                </>
              ) : (
                "Launch Guild"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
