'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/actions/profile.action';
import toast from 'react-hot-toast';
import { UserAvatar } from '@/components/UserAvatar';

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
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      const formData = new FormData();
      Object.entries(profileForm).forEach(([key, val]) => {
        formData.append(key, val);
      });

      const res = await updateProfile(formData);
      if (res.success) {
        toast.success('Settings updated successfully!');
      } else {
        toast.error(res.error || 'Failed to update settings');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public Profile</CardTitle>
        <CardDescription>Update your personal info displayed on your public profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="flex items-center gap-4 py-2">
            <UserAvatar src={user.image} name={user.name} className="w-16 h-16" />
            <div>
              <p className="text-sm font-semibold">{user.name || user.username}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profileForm.username}
                onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileForm.location}
                onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={profileForm.website}
                onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save Profile Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
