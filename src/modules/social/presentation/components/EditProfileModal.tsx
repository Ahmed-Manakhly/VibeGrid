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
import { useInput } from '@/shared/presentation/hooks/useInput';
import { validateUsername, validateRequired, validateUrl } from '@/shared/utils/validation';

interface EditProfileModalProps {
  user: {
    id: string;
    name: string | null;
    username: string;
    bio: string | null;
    location: string | null;
    website: string | null;
    image: string | null;
    techStack?: any;
    developerLinks?: any;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({ user, open, onOpenChange }: EditProfileModalProps) {
  const { isUploading, previewUrl, handleFileSelect, uploadAvatar } = useAvatarUpload();
  const { refreshSession } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const initialStack: string[] = Array.isArray(user.techStack)
    ? user.techStack
    : typeof user.techStack === 'string'
    ? (JSON.parse(user.techStack || '[]') as string[])
    : [];

  const initialLinks: { type: string; url: string; label?: string }[] = Array.isArray(user.developerLinks)
    ? user.developerLinks
    : typeof user.developerLinks === 'string'
    ? JSON.parse(user.developerLinks || '[]')
    : [];

  // useInput Hooks for profile form inputs
  const usernameInput = useInput({
    initialValue: user.username || '',
    validators: [
      (val) => {
        if (val.trim().startsWith('user_')) {
          return 'Temporary handles starting with "user_" are not allowed';
        }
        return validateUsername(val);
      },
    ],
  });

  const nameInput = useInput({
    initialValue: user.name || '',
    validators: [(val) => validateRequired(val, 'Display Name')],
  });

  const websiteInput = useInput({
    initialValue: user.website || '',
    validators: [validateUrl],
  });

  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');

  const [techStack, setTechStack] = useState<string[]>(initialStack);
  const [newTechInput, setNewTechInput] = useState('');

  const [developerLinks, setDeveloperLinks] = useState<{ type: string; url: string; label?: string }[]>(initialLinks);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkType, setNewLinkType] = useState('github');

  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTech = () => {
    const trimmed = newTechInput.trim();
    if (!trimmed) return;
    const exists = techStack.some(t => t.toLowerCase() === trimmed.toLowerCase());
    if (exists) return;
    setTechStack([...techStack, trimmed]);
    setNewTechInput('');
  };

  const handleRemoveTech = (techToRemove: string) => {
    setTechStack(techStack.filter(t => t !== techToRemove));
  };

  const handleAddLink = () => {
    const trimmed = newLinkUrl.trim();
    if (!trimmed) return;

    const urlCheck = validateUrl(trimmed);
    if (typeof urlCheck === 'string') {
      setLinkError(urlCheck);
      return;
    }

    setDeveloperLinks([...developerLinks, { type: newLinkType, url: trimmed }]);
    setNewLinkUrl('');
    setLinkError(null);
  };

  const handleRemoveLink = (index: number) => {
    setDeveloperLinks(developerLinks.filter((_, i) => i !== index));
  };

  const handleEditSubmit = async () => {
    usernameInput.inputBlurHandler();
    nameInput.inputBlurHandler();
    websiteInput.inputBlurHandler();

    if (!usernameInput.valueIsValid) {
      toast.error(usernameInput.errorMessage || 'Invalid username');
      return;
    }

    if (!nameInput.valueIsValid) {
      toast.error(nameInput.errorMessage || 'Display name is required');
      return;
    }

    if (!websiteInput.valueIsValid) {
      toast.error(websiteInput.errorMessage || 'Invalid website URL');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalMediaId: string | null = null;
      if (previewUrl) {
        finalMediaId = await uploadAvatar();
      }

      const formData = new FormData();
      formData.append('username', usernameInput.value.trim());
      formData.append('name', nameInput.value.trim());
      formData.append('bio', bio.trim());
      formData.append('location', location.trim());
      formData.append('website', websiteInput.value.trim());
      formData.append('techStack', JSON.stringify(techStack));
      formData.append('developerLinks', JSON.stringify(developerLinks));

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
      <DialogContent className="w-[95vw] sm:max-w-[540px] max-h-[85vh] flex flex-col p-4 sm:p-6 overflow-hidden rounded-2xl">
        <DialogHeader className="shrink-0 pb-3 border-b border-border/40">
          <DialogTitle className="text-base sm:text-lg">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-3 sm:py-4 pr-1 sm:pr-2 min-w-0 [overflow-wrap:anywhere]">
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
              value={usernameInput.value}
              onChange={(e) => usernameInput.setValue(e.target.value)}
              onBlur={usernameInput.inputBlurHandler}
              placeholder="Your unique handle"
              className={usernameInput.hasError ? 'border-destructive ring-1 ring-destructive' : ''}
            />
            {usernameInput.hasError && usernameInput.errorMessage && (
              <p className="text-xs text-destructive mt-1">{usernameInput.errorMessage}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              name="name"
              value={nameInput.value}
              onChange={(e) => nameInput.setValue(e.target.value)}
              onBlur={nameInput.inputBlurHandler}
              placeholder="Your name"
              className={nameInput.hasError ? 'border-destructive ring-1 ring-destructive' : ''}
            />
            {nameInput.hasError && nameInput.errorMessage && (
              <p className="text-xs text-destructive mt-1">{nameInput.errorMessage}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[100px]"
              placeholder="Tell us about yourself"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you based?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              value={websiteInput.value}
              onChange={(e) => websiteInput.setValue(e.target.value)}
              onBlur={websiteInput.inputBlurHandler}
              placeholder="https://yourwebsite.com"
              className={`break-all [overflow-wrap:anywhere] ${websiteInput.hasError ? 'border-destructive ring-1 ring-destructive' : ''}`}
            />
            {websiteInput.hasError && websiteInput.errorMessage && (
              <p className="text-xs text-destructive mt-1">{websiteInput.errorMessage}</p>
            )}
          </div>

          {/* Tech Stack section */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <Label>Tech Stack</Label>
            <div className="flex gap-2">
              <Input
                value={newTechInput}
                onChange={(e) => setNewTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
                placeholder="e.g. TypeScript, React, Docker"
                className="text-xs sm:text-sm"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddTech}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 font-medium"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(tech)}
                    className="hover:text-destructive transition-colors text-xs font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Developer Links section */}
          <div className="space-y-2 pt-2 border-t border-border/50 min-w-0">
            <Label>Developer Links</Label>
            <div className="flex gap-2">
              <select
                value={newLinkType}
                onChange={(e) => setNewLinkType(e.target.value)}
                className="px-2.5 py-1.5 rounded-md border border-input bg-background text-xs sm:text-sm shrink-0"
              >
                <option value="github">GitHub</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">X / Twitter</option>
                <option value="portfolio">Portfolio</option>
                <option value="website">Website</option>
                <option value="other">Other</option>
              </select>
              <Input
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                placeholder="https://github.com/username"
                className="text-xs sm:text-sm flex-1 min-w-0"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddLink} className="shrink-0">
                Add Link
              </Button>
            </div>
            {linkError && (
              <p className="text-xs text-destructive mt-1">{linkError}</p>
            )}
            <div className="space-y-1.5 pt-1.5 min-w-0">
              {developerLinks.map((link, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 text-xs border border-border/40 min-w-0 w-full overflow-hidden">
                  <span className="font-semibold uppercase text-[10px] text-primary/80 shrink-0">{link.type}</span>
                  <span className="truncate min-w-0 flex-1 text-muted-foreground">{link.url}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(idx)}
                    className="text-destructive hover:underline text-xs font-medium shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0 pt-3 border-t border-border/40 flex justify-end gap-3">
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
