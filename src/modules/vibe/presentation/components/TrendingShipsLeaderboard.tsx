"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Rocket, ExternalLink, Github, ArrowUpRight, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { TrendingShipItem } from "@/modules/vibe/domain/TrendingShipsScorer";
import { getTrendingShipsAction } from "@/actions/post.action";

interface TrendingShipsLeaderboardProps {
  initialShips?: TrendingShipItem[];
  title?: string;
  limit?: number;
}

export function TrendingShipsLeaderboard({
  initialShips = [],
  title = "Trending Ships",
  limit = 5,
}: TrendingShipsLeaderboardProps) {
  const [ships, setShips] = useState<TrendingShipItem[]>(initialShips);
  const [loading, setLoading] = useState(initialShips.length === 0);

  useEffect(() => {
    if (initialShips.length === 0) {
      getTrendingShipsAction(limit)
        .then((data) => {
          if (data) setShips(data);
        })
        .finally(() => setLoading(false));
    }
  }, [initialShips, limit]);

  if (!loading && ships.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl border bg-card/40 backdrop-blur-xs shadow-none">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono tracking-widest text-muted-foreground uppercase text-xs flex items-center gap-1.5">
            <Trophy className="size-3.5 text-brand-gold" />
            <span>{title}</span>
          </CardTitle>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold font-bold border border-brand-gold/25 flex items-center gap-1">
            <Flame className="size-3" />
            Daily Top
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground animate-pulse font-mono">
            Scanning community launches...
          </div>
        ) : (
          ships.map((ship, idx) => {
            const rank = String(idx + 1).padStart(2, "0");
            const rankColor =
              idx === 0
                ? "text-brand-gold font-bold"
                : idx === 1
                ? "text-muted-foreground font-semibold"
                : idx === 2
                ? "text-brand-gold/70 font-semibold"
                : "text-muted-foreground";

            return (
              <div
                key={ship.id}
                className="group p-2.5 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/40 hover:border-primary/40 transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-mono text-xs ${rankColor}`}>
                      {rank}
                    </span>
                    <Link
                      href={`/vibes/${ship.id}`}
                      className="font-semibold text-xs text-foreground group-hover:text-primary transition truncate hover:underline"
                    >
                      {ship.projectName}
                    </Link>
                  </div>
                  <span className="shrink-0 text-[11px] font-mono font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                    ▲ {ship.upvotesCount}
                  </span>
                </div>

                {ship.tagline && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 leading-normal">
                    {ship.tagline}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <UserAvatar
                      src={ship.author.image}
                      name={ship.author.name}
                      className="size-4"
                    />
                    <span className="truncate">@{ship.author.username}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {ship.repoUrl && (
                      <a
                        href={ship.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition p-0.5"
                        title="GitHub Repo"
                      >
                        <Github className="size-3" />
                      </a>
                    )}
                    {ship.demoUrl && (
                      <a
                        href={ship.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition p-0.5"
                        title="Live Demo"
                      >
                        <ArrowUpRight className="size-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
