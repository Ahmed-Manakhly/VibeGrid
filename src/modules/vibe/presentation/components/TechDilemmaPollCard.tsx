"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { BarChart3, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { votePollAction } from "@/actions/post.action";
import { useSession } from "@/components/auth/SessionProvider";
import { toast } from "@/components/ui/toast";

export interface PollOptionUI {
  id: string;
  text: string;
  index: number;
  votesCount?: number;
  percentage?: number;
}

export interface PollUI {
  id: string;
  question: string;
  expiresAt: string | Date;
  options: PollOptionUI[];
  votes?: Array<{ userId: string; optionId: string }>;
}

interface TechDilemmaPollCardProps {
  poll: PollUI;
}

export function TechDilemmaPollCard({ poll }: TechDilemmaPollCardProps) {
  const { user, isAuthenticated } = useSession();

  // Find if current user already voted from initial props
  const initialVotedOptionId =
    user && poll.votes
      ? poll.votes.find((v) => v.userId === user.id)?.optionId || null
      : null;

  const [votedOptionId, setVotedOptionId] = useState<string | null>(initialVotedOptionId);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate initial tallies
  const expiresDate = new Date(poll.expiresAt);
  const isExpired = new Date() > expiresDate;

  const rawTotalVotes = poll.options.reduce(
    (acc, opt) => acc + (opt.votesCount ?? 0),
    0
  );

  const [totalVotes, setTotalVotes] = useState(rawTotalVotes);
  const [options, setOptions] = useState<PollOptionUI[]>(poll.options);

  const hasVoted = Boolean(votedOptionId);
  const showResults = hasVoted || isExpired;

  const handleVote = async (optionId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to vote in tech dilemmas.");
      return;
    }
    if (hasVoted || isExpired) return;

    setLoading(true);
    setError(null);

    try {
      const res = await votePollAction(poll.id, optionId);
      if (res.success && res.tallies) {
        setVotedOptionId(optionId);
        setTotalVotes(res.tallies.totalVotes);
        setOptions(res.tallies.options);
      } else {
        setError(res.error || "Failed to record vote.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-3 p-4 rounded-xl border border-border/80 bg-gradient-to-br from-card/80 to-muted/20 backdrop-blur-xs shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
          <BarChart3 className="size-3.5" />
          <span>Tech Dilemma Poll</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          <span>
            {isExpired
              ? "Final Results"
              : `Ends in ${formatDistanceToNow(expiresDate)}`}
          </span>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-foreground leading-snug">
        {poll.question}
      </h4>

      {error && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}

      {/* Options List */}
      <div className="space-y-2">
        {options.map((opt) => {
          const count = opt.votesCount ?? 0;
          const percentage =
            opt.percentage !== undefined
              ? opt.percentage
              : totalVotes > 0
              ? Math.round((count / totalVotes) * 100)
              : 0;

          const isUserVote = votedOptionId === opt.id;

          if (showResults) {
            return (
              <div
                key={opt.id}
                className={`relative overflow-hidden rounded-lg border p-2.5 transition-all ${
                  isUserVote
                    ? "border-primary/60 bg-primary/5 font-semibold"
                    : "border-border/60 bg-muted/30"
                }`}
              >
                {/* Progress bar background fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isUserVote ? "bg-primary/20" : "bg-muted-foreground/15"
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative flex items-center justify-between text-xs gap-2">
                  <span className="flex items-center gap-1.5 truncate">
                    {isUserVote && (
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    )}
                    <span className="truncate">{opt.text}</span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground shrink-0 font-medium">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          }

          // Voting state
          return (
            <button
              key={opt.id}
              type="button"
              disabled={loading}
              onClick={() => handleVote(opt.id)}
              className="w-full text-left p-2.5 rounded-lg border border-border/70 bg-card hover:border-primary/50 hover:bg-primary/5 transition text-xs font-medium flex items-center justify-between group"
            >
              <span className="group-hover:text-primary transition">
                {opt.text}
              </span>
              <span className="size-4 rounded-full border border-border group-hover:border-primary transition shrink-0" />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
        <span>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </span>
        {!showResults && (
          <span className="italic">Click an option to cast your vote</span>
        )}
      </div>
    </div>
  );
}
