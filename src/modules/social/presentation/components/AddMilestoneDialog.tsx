"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMilestoneAction } from "@/actions/profile.action";
import { SerializedMilestone } from "./DeveloperMilestoneTimeline";

interface AddMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (milestone: SerializedMilestone) => void;
}

export function AddMilestoneDialog({
  open,
  onOpenChange,
  onCreated,
}: AddMilestoneDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [category, setCategory] = useState("RELEASE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [achievedDate, setAchievedDate] = useState(
    new Date().toISOString().substring(0, 10)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a milestone title.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("category", category);
    if (description.trim()) formData.append("description", description.trim());
    if (linkUrl.trim()) formData.append("linkUrl", linkUrl.trim());
    formData.append("achievedAt", achievedDate);

    try {
      const res = await createMilestoneAction(formData);
      if (res.success && res.milestone) {
        onCreated(res.milestone as SerializedMilestone);
        onOpenChange(false);
        setTitle("");
        setDescription("");
        setLinkUrl("");
      } else {
        setError(res.error || "Failed to create milestone");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Career / Tech Milestone</DialogTitle>
            <DialogDescription>
              Document your major shipments, contributions, promotions, and achievements.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20 font-medium">
              {error}
            </div>
          )}

          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RELEASE">🚀 Shipped Release</SelectItem>
                  <SelectItem value="OPEN_SOURCE">🐙 Open Source</SelectItem>
                  <SelectItem value="PROMOTION">💼 Career / Promotion</SelectItem>
                  <SelectItem value="AWARD">🏆 Recognition / Award</SelectItem>
                  <SelectItem value="EDUCATION">🎓 Certification / Degree</SelectItem>
                  <SelectItem value="OTHER">✨ Other Highlight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="title">Milestone Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Launched VibeGrid v1.0 or Became Core Maintainer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="achievedDate">Date Achieved</Label>
              <Input
                id="achievedDate"
                type="date"
                value={achievedDate}
                onChange={(e) => setAchievedDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="linkUrl">Project / Evidence URL</Label>
              <Input
                id="linkUrl"
                type="url"
                placeholder="https://github.com/... or https://producthunt.com/..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Details / Impact</Label>
              <Textarea
                id="description"
                placeholder="What did you build or achieve? What technologies or scale were involved?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add to Timeline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
