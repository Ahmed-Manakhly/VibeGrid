'use client';

import React, { useState } from 'react';
import { updateProfile } from '@/actions/profile.action';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import { useAvatarUpload } from '@/modules/media/presentation/hooks/useAvatarUpload';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/components/auth/SessionProvider';
import { usePathname, useRouter } from 'next/navigation';

interface EditProfileModalProps {
  user: {
    id: string;
    name: string | null;
    username: string;
    bio: string | null;
    location: string | null;
    website: string | null;
    image: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ user, open, onOpenChange }: EditProfileModalProps) {
  const { isUploading, previewUrl, handleFileSelect, uploadAvatar } = useAvatarUpload();
  const { refreshSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
  });
  const [errors, setErrors] = useState<{
    username?: string;
    name?: string;
    website?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: { username?: string; name?: string; website?: string } = {};

    const trimmedUsername = editForm.username.trim();
    if (!trimmedUsername) {
      newErrors.username = 'Username is required';
    } else if (trimmedUsername.startsWith('user_')) {
      newErrors.username = 'Temporary handles starting with "user_" are not allowed';
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    const trimmedName = editForm.name.trim();
    if (!trimmedName) {
      newErrors.name = 'Display name is required';
    }

    const trimmedWebsite = editForm.website.trim();
    if (trimmedWebsite) {
      try {
        const urlToTest = /^https?:\/\//i.test(trimmedWebsite)
          ? trimmedWebsite
          : `https://${trimmedWebsite}`;
        new URL(urlToTest);
      } catch (_) {
        newErrors.website = 'Please enter a valid website URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let finalMediaId: string | null = null;
      if (previewUrl) {
        finalMediaId = await uploadAvatar();
      }

      const formData = new FormData();
      formData.append('username', editForm.username.trim());
      formData.append('name', editForm.name.trim());
      formData.append('bio', editForm.bio.trim());
      formData.append('location', editForm.location.trim());
      formData.append('website', editForm.website.trim());

      if (finalMediaId) {
        formData.append('avatarMediaId', finalMediaId);
      }

      const result = await updateProfile(formData);
      if (result && result.success) {
        await refreshSession();
        onOpenChange(false);

        const newUsername = result.user?.username;
        if (newUsername && newUsername !== user.username) {
          router.push(`/profile/${newUsername}`);
        } else {
          router.replace(pathname, { scroll: false });
          router.refresh();
        }
        toast.success('Profile updated successfully');
      } else {
        toast.error(result?.error || 'Failed to update profile');
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex flex-col items-center gap-3">
            <UserAvatar src={previewUrl || user.image} name={user.name} className="w-20 h-20" />
            <Label htmlFor="avatar-file" className="cursor-pointer text-xs font-semibold text-primary hover:underline">
              Change Profile Picture
            </Label>
            <Input
              id="avatar-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={editForm.username}
              onChange={(e) => {
                setEditForm({ ...editForm, username: e.target.value });
                if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              placeholder="Your unique handle"
            />
            {errors.username && (
              <p className="text-xs text-destructive mt-1">{errors.username}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              name="name"
              value={editForm.name}
              onChange={(e) => {
                setEditForm({ ...editForm, name: e.target.value });
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Your name"
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="min-h-[100px]"
              placeholder="Tell us about yourself"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              placeholder="Where are you based?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={editForm.website}
              onChange={(e) => {
                setEditForm({ ...editForm, website: e.target.value });
                if (errors.website) setErrors((prev) => ({ ...prev, website: undefined }));
              }}
              placeholder="https://yourwebsite.com"
            />
            {errors.website && (
              <p className="text-xs text-destructive mt-1">{errors.website}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline" disabled={isUploading || isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleEditSubmit} disabled={isUploading || isSubmitting}>
            {isUploading || isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
