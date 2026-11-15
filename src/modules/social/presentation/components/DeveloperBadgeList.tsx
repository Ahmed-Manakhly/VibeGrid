"use client";

import React from "react";
import { ShieldCheck, Award, Code, Sparkles, CheckCircle2 } from "lucide-react";

interface DeveloperBadgeListProps {
  solutionsCount?: number;
  isStaffOrAdmin?: boolean;
  hasMilestones?: boolean;
  techStackCount?: number;
}

export function DeveloperBadgeList({
  solutionsCount = 0,
  isStaffOrAdmin = false,
  hasMilestones = false,
  techStackCount = 0,
}: DeveloperBadgeListProps) {
  const badges: Array<{
    id: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
  }> = [];

  if (isStaffOrAdmin) {
    badges.push({
      id: "admin",
      label: "VibeGrid Core",
      description: "Platform Core Team & Verified Staff",
      icon: ShieldCheck,
      color: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    });
  }

  if (solutionsCount > 0) {
    badges.push({
      id: "solver",
      label: `${solutionsCount} Solutions Accepted`,
      description: "Verified Technical Problem Solver",
      icon: CheckCircle2,
      color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    });
  }

  if (techStackCount >= 3) {
    badges.push({
      id: "polyglot",
      label: "Polyglot Developer",
      description: "Proven across multiple language and stack ecosystems",
      icon: Code,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    });
  }

  if (hasMilestones) {
    badges.push({
      id: "builder",
      label: "Active Shipper",
      description: "Documented product releases and milestones",
      icon: Sparkles,
      color: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="pt-3 border-t border-border/60 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Award className="size-3.5" />
        Recognitions & Badges
      </p>
      <div className="flex flex-wrap gap-2">
        {badges.map((b) => {
          const Icon = b.icon;
          return (
            <div
              key={b.id}
              title={b.description}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium cursor-help transition hover:opacity-90 ${b.color}`}
            >
              <Icon className="size-3.5" />
              <span>{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
