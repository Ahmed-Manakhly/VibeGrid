"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import Link from "next/link";
import { UserAvatar } from "./UserAvatar";
import { FollowButton } from "@/modules/social/presentation/components/FollowButton";

interface SuggestedUser {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  matchRationale?: string;
}

interface WhoToFollowClientProps {
  initialUsers: SuggestedUser[];
}

export function WhoToFollowClient({ initialUsers }: WhoToFollowClientProps) {
  const [users, setUsers] = useState<SuggestedUser[]>(initialUsers);

  const handleFollowChange = (userId: string, isNowFollowing: boolean) => {
    // If user followed this suggested user at runtime, immediately remove from suggestions
    if (isNowFollowing) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  if (users.length === 0) return null;

  return (
    <Card className="rounded-xl border bg-card/30 shadow-none">
      <CardHeader>
        <CardTitle className="font-mono tracking-widest text-muted-foreground uppercase text-sm">
          Who to Tune In To
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-secondary/20 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <Link href={`/profile/${user.username}`} className="shrink-0">
                  <UserAvatar src={user.image} name={user.name} className="size-9 transition-all hover:scale-105" />
                </Link>
                <div className="text-xs min-w-0">
                  <Link href={`/profile/${user.username}`} className="font-semibold cursor-pointer hover:underline text-foreground block truncate">
                    {user.name}
                  </Link>
                  <p className="text-muted-foreground text-[11px] truncate font-mono">@{user.username}</p>
                  {user.matchRationale && (
                    <span className="inline-block mt-0.5 text-[10px] font-medium text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded">
                      {user.matchRationale}
                    </span>
                  )}
                </div>
              </div>
              <div className="self-end sm:self-center shrink-0">
                <FollowButton
                  userId={user.id}
                  className="h-7 px-3 text-xs rounded-xl"
                  onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
