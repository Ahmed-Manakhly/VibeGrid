"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Rocket,
  GitPullRequest,
  Award,
  Briefcase,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddMilestoneDialog } from "./AddMilestoneDialog";
import { deleteMilestoneAction } from "@/actions/profile.action";
import { toast } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface SerializedMilestone {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: string;
  icon: string | null;
  linkUrl: string | null;
  achievedAt: string;
}

interface DeveloperMilestoneTimelineProps {
  milestones: SerializedMilestone[];
  isOwner: boolean;
  username: string;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; colorClass: string }
> = {
  RELEASE: {
    label: "Shipped Release",
    icon: Rocket,
    colorClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  },
  OPEN_SOURCE: {
    label: "Open Source",
    icon: GitPullRequest,
    colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  AWARD: {
    label: "Recognition / Award",
    icon: Award,
    colorClass: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  },
  PROMOTION: {
    label: "Career / Promotion",
    icon: Briefcase,
    colorClass: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  },
  EDUCATION: {
    label: "Certification / Learning",
    icon: GraduationCap,
    colorClass: "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
  },
  OTHER: {
    label: "Milestone",
    icon: Sparkles,
    colorClass: "bg-pink-500/10 text-pink-500 border-pink-500/30",
  },
};

export function DeveloperMilestoneTimeline({
  milestones: initialMilestones,
  isOwner,
  username,
}: DeveloperMilestoneTimelineProps) {
  const [milestones, setMilestones] = useState<SerializedMilestone[]>(initialMilestones);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreated = (newMilestone: SerializedMilestone) => {
    setMilestones((prev) => [newMilestone, ...prev]);
  };

  const executeDeleteMilestone = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setDeletingId(id);
    try {
      const res = await deleteMilestoneAction(id);
      if (res.success) {
        setMilestones((prev) => prev.filter((m) => m.id !== id));
        toast.success("Milestone removed");
        setConfirmDeleteId(null);
      } else {
        toast.error(res.error || "Failed to delete milestone");
      }
    } catch {
      toast.error("Failed to delete milestone");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight">Developer Journey</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Key releases, open source contributions, and career achievements.
          </p>
        </div>
        {isOwner && (
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="gap-1.5 text-xs font-medium self-start sm:self-auto shrink-0"
          >
            <Plus className="size-3.5" />
            Add Milestone
          </Button>
        )}
      </div>

      {milestones.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/20">
          <CardContent className="py-10 text-center space-y-2">
            <Sparkles className="size-8 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium">No milestones logged yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isOwner
                ? "Showcase your career highlights, open source milestones, and major product launches here."
                : `@${username} hasn't documented their timeline milestones yet.`}
            </p>
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="mt-3 text-xs"
              >
                Log First Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-6 border-l border-border/60 space-y-6 ml-3">
          {milestones.map((milestone) => {
            const config =
              CATEGORY_CONFIG[milestone.category] || CATEGORY_CONFIG.OTHER;
            const Icon = config.icon;
            const dateStr = format(new Date(milestone.achievedAt), "MMMM yyyy");

            return (
              <div key={milestone.id} className="relative group">
                {/* Node icon circle */}
                <div
                  className={`absolute -left-[35px] top-1 size-7 rounded-full border flex items-center justify-center ${config.colorClass} bg-background shadow-xs`}
                >
                  <Icon className="size-3.5" />
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-card/60 backdrop-blur-xs transition hover:border-primary/40 hover:shadow-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md border ${config.colorClass}`}
                        >
                          {config.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {dateStr}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {milestone.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {milestone.linkUrl && (
                        <a
                          href={milestone.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
                          title="Visit link"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(milestone.id)}
                          disabled={deletingId === milestone.id}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                          title="Delete milestone"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {milestone.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {milestone.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isOwner && (
        <AddMilestoneDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onCreated={handleCreated}
        />
      )}

      {/* Themed Milestone Delete Confirmation */}
      <AlertDialog open={Boolean(confirmDeleteId)} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Milestone?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this milestone from your developer timeline? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={Boolean(deletingId)} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDeleteMilestone}
              disabled={Boolean(deletingId)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl"
            >
              {deletingId ? "Removing..." : "Remove Milestone"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
