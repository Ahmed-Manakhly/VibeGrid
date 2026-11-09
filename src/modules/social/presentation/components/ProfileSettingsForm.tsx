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
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Public Profile</CardTitle>
            <CardDescription>Your public developer profile, bio, tech stack, and social links.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {user.username && (
              <Link href={`/profile/${user.username}`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  View Profile
                </Button>
              </Link>
            )}
            <Link href={profileUrl}>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Edit3 className="size-4" />
                <span>Edit Profile</span>
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 py-2 border-b border-border/40 pb-4">
          <UserAvatar src={user.image} name={user.name || user.username} className="w-16 h-16" />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              {user.name || user.username}
            </h3>
            <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-muted-foreground pt-1">
          <div>
            <span className="font-semibold text-foreground block mb-0.5">Bio</span>
            <p className="line-clamp-2 italic">{user.bio || 'No bio set'}</p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
              <span>{user.location || 'No location set'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="size-3.5 text-muted-foreground shrink-0" />
              {user.website ? (
                <a
                  href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {user.website}
                </a>
              ) : (
                <span>No website set</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
