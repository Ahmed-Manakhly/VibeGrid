"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { BarChart3, CheckCircle2, Clock, Trophy, Lock } from "lucide-react";
import { votePollAction } from "@/actions/post.action";
import { useSession } from "@/components/auth/SessionProvider";
import { useRealtime } from "@/shared/infrastructure/socket/RealtimeProvider";
import { toast } from "@/components/ui/toast";
import { t } from "@/lib/copy";

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
  userVotedOptionId?: string | null;
}

interface TechDilemmaPollCardProps {
  poll: PollUI;
}

export function TechDilemmaPollCard({ poll }: TechDilemmaPollCardProps) {
  const { user, isAuthenticated } = useSession();
  const { latestFeedSignal } = useRealtime();

  // Normalize initial options with fallback to Prisma's _count.votes
  const normalizedInitialOptions = useMemo<PollOptionUI[]>(() => {
    return (poll.options || []).map((opt: any) => {
      const count =
        opt.votesCount !== undefined
          ? opt.votesCount
          : (opt._count?.votes ?? 0);
      return {
        id: opt.id,
        text: opt.text,
        index: opt.index,
        votesCount: count,
        percentage: opt.percentage,
      };
    });
  }, [poll.options]);

  // Find if current user already voted from initial props or poll object
  const initialVotedOptionId = useMemo(() => {
    if (poll.userVotedOptionId) return poll.userVotedOptionId;
    if (user && poll.votes && Array.isArray(poll.votes)) {
      return poll.votes.find((v) => v.userId === user.id)?.optionId || null;
    }
    return null;
  }, [poll.userVotedOptionId, poll.votes, user]);

  const [votedOptionId, setVotedOptionId] = useState<string | null>(initialVotedOptionId);
  const [options, setOptions] = useState<PollOptionUI[]>(normalizedInitialOptions);
  const [totalVotes, setTotalVotes] = useState(() =>
    normalizedInitialOptions.reduce((acc, opt) => acc + (opt.votesCount ?? 0), 0)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expiration and countdown state
  const expiresDate = useMemo(() => new Date(poll.expiresAt), [poll.expiresAt]);
  const [isExpired, setIsExpired] = useState(() => new Date() >= expiresDate);
  const [timeStatus, setTimeStatus] = useState<string>("");

  // Sync state if poll props change (e.g. feed re-fetch)
  useEffect(() => {
    setOptions(normalizedInitialOptions);
    setTotalVotes(
      normalizedInitialOptions.reduce((acc, opt) => acc + (opt.votesCount ?? 0), 0)
    );
  }, [normalizedInitialOptions]);

  useEffect(() => {
    if (initialVotedOptionId && !votedOptionId) {
      setVotedOptionId(initialVotedOptionId);
    }
  }, [initialVotedOptionId, votedOptionId]);

  // Realtime socket synchronization for live poll updates
  useEffect(() => {
    if (!latestFeedSignal) return;
    if (
      latestFeedSignal.type === "poll_voted" &&
      (latestFeedSignal.pollId === poll.id || latestFeedSignal.postId === (poll as any).postId)
    ) {
      if (latestFeedSignal.pollTallies) {
        setTotalVotes(latestFeedSignal.pollTallies.totalVotes);
        setOptions(latestFeedSignal.pollTallies.options);
      }
    }
  }, [latestFeedSignal, poll.id]);

  // Realtime countdown and automatic expiration
  useEffect(() => {
    const updateExpiry = () => {
      const now = new Date();
      if (now >= expiresDate) {
        setIsExpired(true);
        setTimeStatus("Poll Closed • Final Results");
      } else {
        setIsExpired(false);
        setTimeStatus(`Ends in ${formatDistanceToNow(expiresDate)}`);
      }
    };

    updateExpiry();
    const interval = setInterval(updateExpiry, 2000); // 2s precision for testing short expiry
    return () => clearInterval(interval);
  }, [expiresDate]);

  const hasVoted = Boolean(votedOptionId);
  const showResults = hasVoted || isExpired;

  // Compute highest vote count to highlight the winner when closed
  const maxVotes = useMemo(() => {
    return Math.max(...options.map((o) => o.votesCount ?? 0), 0);
  }, [options]);

  const handleVote = async (optionId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to vote in tech dilemmas.");
      return;
    }
    if (hasVoted) {
      toast.info("You have already voted in this dilemma.");
      return;
    }
    if (isExpired) {
      toast.error("This poll has ended and is closed for voting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await votePollAction(poll.id, optionId);
      if (res.success && res.tallies) {
        setVotedOptionId(optionId);
        setTotalVotes(res.tallies.totalVotes);
        setOptions(res.tallies.options);
        toast.success("Vote recorded successfully!");
      } else {
        setError(res.error || "Failed to record vote.");
        toast.error(res.error || "Failed to record vote.");
      }
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-3 p-4 rounded-xl border border-border/80 bg-gradient-to-br from-card/80 to-muted/20 backdrop-blur-xs shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
          <BarChart3 className="size-3.5" />
          <span>{t("feed.poll.title")}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono">
          {isExpired ? (
            <Lock className="size-3 text-amber-500" />
          ) : (
            <Clock className="size-3 text-muted-foreground" />
          )}
          <span
            className={
              isExpired
                ? "text-amber-500 font-semibold"
                : "text-muted-foreground"
            }
          >
            {timeStatus}
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
          const isWinner = isExpired && maxVotes > 0 && count === maxVotes;

          if (showResults) {
            return (
              <div
                key={opt.id}
                className={`relative overflow-hidden rounded-lg border p-2.5 transition-all ${
                  isWinner
                    ? "border-emerald-500/60 bg-emerald-500/10 font-semibold"
                    : isUserVote
                    ? "border-primary/60 bg-primary/5 font-semibold"
                    : "border-border/60 bg-muted/30"
                }`}
              >
                {/* Progress bar background fill */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isWinner
                      ? "bg-emerald-500/20"
                      : isUserVote
                      ? "bg-primary/20"
                      : "bg-muted-foreground/15"
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative flex items-center justify-between text-xs gap-2">
                  <span className="flex items-center gap-1.5 truncate">
                    {isWinner && (
                      <Trophy className="size-3.5 text-emerald-400 shrink-0" />
                    )}
                    {isUserVote && !isWinner && (
                      <CheckCircle2 className="size-3.5 text-primary shrink-0" />
                    )}
                    <span className="truncate">{opt.text}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                    {isWinner && (
                      <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        Winner
                      </span>
                    )}
                    <span className="text-muted-foreground font-medium">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // Voting state
          return (
            <button
              key={opt.id}
              type="button"
              disabled={loading || isExpired}
              onClick={() => handleVote(opt.id)}
              className="w-full text-left p-2.5 rounded-lg border border-border/70 bg-card hover:border-primary/50 hover:bg-primary/5 transition text-xs font-medium flex items-center justify-between group disabled:opacity-50"
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
        {isExpired ? (
          <span className="text-amber-500 font-medium">{t("feed.poll.votingClosed")}</span>
        ) : !showResults ? (
          <span className="italic">{t("feed.poll.votingPrompt")}</span>
        ) : (
          <span className="text-primary font-medium">Vote submitted</span>
        )}
      </div>
    </div>
  );
}
