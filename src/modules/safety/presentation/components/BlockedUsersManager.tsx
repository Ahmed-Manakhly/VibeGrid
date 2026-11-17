'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { getBlockedUsersAction, unblockUserAction } from '@/actions/safety.action';
import { toast } from '@/components/ui/toast';
import { Ban, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface BlockedUser {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  blockedAt: string;
}

export function BlockedUsersManager() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlockedUsers = async () => {
    setIsLoading(true);
    try {
      const res = await getBlockedUsersAction();
      if (res.success && res.data) {
        setBlockedUsers(res.data);
      }
    } catch {
      toast.error('Failed to load blocked accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (userId: string, username: string) => {
    setUnblockingId(userId);
    try {
      const res = await unblockUserAction(userId);
      if (res.success) {
        setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
        toast.success(`Unblocked @${username}`);
      } else {
        toast.error(res.error || 'Failed to unblock user');
      }
    } catch {
      toast.error('Failed to unblock user');
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <Card className="border border-white/10 bg-card/60 backdrop-blur-xl shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 text-destructive">
          <Ban className="size-5" />
          <CardTitle className="text-base font-semibold">Blocked Accounts</CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Accounts you have blocked. They cannot view your posts, send messages, or interact with your profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2 text-xs">
            <Loader2 className="size-4 animate-spin" />
            <span>Loading blocked accounts...</span>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border/50 rounded-xl space-y-1.5">
            <CheckCircle className="size-6 text-emerald-400 mx-auto opacity-80" />
            <p className="text-sm font-medium text-foreground">No Blocked Accounts</p>
            <p className="text-xs text-muted-foreground">
              You haven't blocked any developers on VibeGrid.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar src={user.image} name={user.name} className="size-9 shrink-0" />
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${user.username}`}
                      className="font-semibold text-sm hover:underline block truncate text-foreground"
                    >
                      {user.name || user.username}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={unblockingId === user.id}
                  onClick={() => handleUnblock(user.id, user.username)}
                  className="text-xs border-border/60 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 shrink-0 font-mono"
                >
                  {unblockingId === user.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    'Unblock'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

