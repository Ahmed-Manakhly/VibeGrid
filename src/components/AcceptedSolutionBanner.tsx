"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Award } from "lucide-react";

interface AcceptedSolutionBannerProps {
  solver: {
    id: string;
    username: string;
    name?: string | null;
    image?: string | null;
    solutionsCount?: number;
  };
  content: string;
  solvedAt?: Date | string | null;
  canUnaccept?: boolean;
  onUnaccept?: () => void;
  isUnaccepting?: boolean;
}

export function AcceptedSolutionBanner({
  solver,
  content,
  solvedAt,
  canUnaccept,
  onUnaccept,
  isUnaccepting,
}: AcceptedSolutionBannerProps) {
  return (
    <div className="my-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 backdrop-blur-sm transition-all duration-200">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Accepted Solution</span>
          {solver.solutionsCount !== undefined && solver.solutionsCount > 0 && (
            <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
              <Award className="h-3 w-3" />
              <span>{solver.solutionsCount} Solved</span>
            </span>
          )}
        </div>
        {canUnaccept && onUnaccept && (
          <button
            onClick={onUnaccept}
            disabled={isUnaccepting}
            className="text-xs text-muted-foreground transition hover:text-red-400 disabled:opacity-50"
          >
            {isUnaccepting ? "Unmarking..." : "Unmark Solution"}
          </button>
        )}
      </div>

      <div className="mt-3 flex items-start space-x-3">
        <Link href={`/profile/${solver.username}`}>
          <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-emerald-500/30">
            {solver.image ? (
              <img
                src={solver.image}
                alt={solver.name || solver.username}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-xs font-bold text-foreground">
                {(solver.name || solver.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1 space-y-1">
          <div className="flex items-center space-x-2">
            <Link
              href={`/profile/${solver.username}`}
              className="text-sm font-semibold text-foreground hover:underline"
            >
              {solver.name || solver.username}
            </Link>
            <span className="text-xs text-muted-foreground">@{solver.username}</span>
            {solvedAt && (
              <span className="text-xs text-muted-foreground">
                · Solved {new Date(solvedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="text-sm text-foreground/90 whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}
