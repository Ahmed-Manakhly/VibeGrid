"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, Shield, Plus, Compass } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateCommunityDialog } from "@/components/community/CreateCommunityDialog";
import { CommunityEntity } from "@/modules/community/domain/ICommunityRepository";

interface MyCommunitiesSidebarProps {
  userId?: string | null;
}

export function MyCommunitiesSidebar({ userId }: MyCommunitiesSidebarProps) {
  const [communities, setCommunities] = useState<CommunityEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    import("@/actions/community.action").then(({ getUserCommunitiesAction }) => {
      getUserCommunitiesAction(userId)
        .then((res) => {
          if (res.success && res.data) {
            setCommunities(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    });
  }, [userId]);

  if (!userId) return null;

  return (
    <Card className="rounded-xl border bg-card/30 shadow-none">
      <CardHeader className="pb-3 flex flex-col gap-2.5">
        <CardTitle className="font-mono tracking-widest text-muted-foreground uppercase text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="size-3.5 text-primary" />
            <span>My Guilds</span>
          </span>
          {communities.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
              {communities.length}
            </span>
          )}
        </CardTitle>
        <div className="w-full">
          <CreateCommunityDialog />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2 py-2">
            <div className="h-9 w-full bg-muted/40 rounded-lg animate-pulse" />
            <div className="h-9 w-full bg-muted/40 rounded-lg animate-pulse" />
          </div>
        ) : communities.length > 0 ? (
          <div className="space-y-2.5">
            {communities.slice(0, 6).map((c) => {
              const initial = c.name?.charAt(0)?.toUpperCase() || "G";
              return (
                <Link
                  key={c.id}
                  href={`/communities/${c.slug}?view=feed`}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/40 group"
                >
                  <Avatar className="size-8 rounded-lg shrink-0 border border-border/50">
                    <AvatarImage src={c.avatarUrl || undefined} alt={c.name} />
                    <AvatarFallback className="rounded-lg bg-secondary text-xs font-mono font-bold text-foreground">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {c.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">
                      /c/{c.slug}
                    </p>
                  </div>
                  {c.userRole && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-mono font-bold shrink-0">
                      {c.userRole}
                    </span>
                  )}
                </Link>
              );
            })}
            {communities.length > 6 && (
              <Link
                href="/communities"
                className="block text-center pt-2 text-[11px] font-mono text-primary hover:underline"
              >
                View all ({communities.length}) →
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-4 px-2 space-y-2">
            <p className="text-xs text-muted-foreground">You have not joined any guilds yet.</p>
            <p className="text-[11px] text-muted-foreground/80">
              Join guilds to exchange targeted code and discuss tech dilemmas.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
