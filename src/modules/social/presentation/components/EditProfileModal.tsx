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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAvatarUpload } from '@/modules/media/presentation/hooks/useAvatarUpload';
import toast from 'react-hot-toast';

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

  const [editForm, setEditForm] = useState({
    name: user.name || '',
    username: user.username || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalMediaId: string | null = null;
      if (previewUrl) {
        finalMediaId = await uploadAvatar();
      }

      const formData = new FormData();
      Object.entries(editForm).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (finalMediaId) {
        formData.append('avatarMediaId', finalMediaId);
      }

      const result = await updateProfile(formData);
      if (result.success) {
        onOpenChange(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.error || 'Failed to update profile');
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
            <Avatar className="w-20 h-20">
              <AvatarImage src={previewUrl || user.image || '/avatar.png'} />
              <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
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
            <Label>Username</Label>
            <Input
              name="username"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              placeholder="Your unique handle"
            />
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              name="name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              name="bio"
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              className="min-h-[100px]"
              placeholder="Tell us about yourself"
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              name="location"
              value={editForm.location}
              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              placeholder="Where are you based?"
            />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              name="website"
              value={editForm.website}
              onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              placeholder="Your personal website"
            />
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
