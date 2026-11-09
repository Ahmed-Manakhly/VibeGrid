'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { Edit3, MapPin, Globe } from 'lucide-react';

interface ProfileSettingsFormProps {
  user: {
    id: string;
    email: string;
    name: string | null;
    username: string;
    bio: string | null;
    location: string | null;
    website: string | null;
    image: string | null;
  };
}

export function ProfileSettingsForm({ user }: ProfileSettingsFormProps) {
  const profileUrl = user.username ? `/profile/${user.username}?edit=true` : '/login';

  return (
    <Card className="feed-card overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg">Public Profile</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Your public developer profile, bio, tech stack, and social links.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
            {user.username && (
              <Link href={`/profile/${user.username}`} className="w-full sm:w-auto">
                <Button variant="ghost" size="sm" className="text-xs w-full sm:w-auto">
                  View Profile
                </Button>
              </Link>
            )}
            <Link href={profileUrl} className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="flex items-center justify-center gap-2 w-full sm:w-auto">
                <Edit3 className="size-4" />
                <span>Edit Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 py-2 border-b border-border/40 pb-4 min-w-0">
          <UserAvatar src={user.image} name={user.name || user.username} className="w-14 h-14 sm:w-16 sm:h-16 shrink-0" />
          <div className="min-w-0 flex-1 overflow-hidden">
            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
              {user.name || user.username}
            </h3>
            <p className="text-xs text-muted-foreground font-mono truncate">@{user.username}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate break-all">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground pt-1 min-w-0">
          <div className="min-w-0">
            <span className="font-semibold text-foreground block mb-0.5">Bio</span>
            <p className="line-clamp-2 italic break-words">{user.bio || 'No bio set'}</p>
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate min-w-0">{user.location || 'No location set'}</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <Globe className="size-3.5 text-muted-foreground shrink-0" />
              {user.website ? (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate min-w-0 flex-1"
                >
                  {user.website}
                </a>
              ) : (
                <span className="truncate min-w-0">No website set</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
