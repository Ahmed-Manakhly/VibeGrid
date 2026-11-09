"use client";

import React, { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Sparkles, Hash } from "lucide-react";
import { createCommunityAction } from "@/actions/community.action";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/toast";

export function CreateCommunityDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
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
          <span>Create Community</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card/95 border-border/60 backdrop-blur-md p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Sparkles className="size-5 text-primary" />
            <span>Create Developer Guild</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Form a high-signal tech circle, open-source collective, or framework guild.
          </p>
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
