'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/UserAvatar';
import { useSession } from '@/components/auth/SessionProvider';
import { updateProfile } from '@/actions/profile.action';
import { toast } from '@/components/ui/toast';
import { Sparkles, Check, ArrowRight, UserCheck, Code } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function UnifiedOnboardingDialog() {
  const { user, isAuthenticated, isLoading, refreshSession } = useSession();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Basic Identity
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // Step 2: Topics
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; emoji: string | null }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSavingTopics, setIsSavingTopics] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    // Check if user has already completed or dismissed onboarding in local session
    const hasDismissed = localStorage.getItem(`onboarding_dismissed_${user.id}`);
    if (hasDismissed) return;

    async function checkState() {
      try {
        const [interestRes, profileRes, filterRes] = await Promise.all([
          fetch('/api/social/interests'),
          user?.username ? fetch(`/api/profile?username=${encodeURIComponent(user.username)}`) : Promise.resolve(null),
          fetch('/api/feed/filters'),
        ]);

        let hasInterests = false;
        let hasBio = false;

        if (interestRes.ok) {
          const interestData = await interestRes.json();
          if (interestData.success && Array.isArray(interestData.interests) && interestData.interests.length > 0) {
            hasInterests = true;
            setSelectedIds(interestData.interests.map((i: any) => i.id));
          }
        }

        if (profileRes && profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.user) {
            setDisplayName(profileData.user.name || '');
            setBio(profileData.user.bio || '');
            setWebsite(profileData.user.website || '');
            if (profileData.user.bio && profileData.user.bio.trim().length > 0) {
              hasBio = true;
            }
          }
        }

        if (filterRes.ok) {
          const filterData = await filterRes.json();
          if (filterData.success && Array.isArray(filterData.categories)) {
            setCategories(filterData.categories);
          }
        }

        // Only pop up if either bio or topics are incomplete
        if (!hasBio || !hasInterests) {
          setCurrentStep(hasBio ? 2 : 1);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Failed checking onboarding status', err);
      }
    }

    checkState();
  }, [isLoading, isAuthenticated, user]);

  const handleCompleteStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingProfile(true);

    try {
      const formData = new FormData();
      formData.append('name', displayName.trim() || user.name || 'Developer');
      if (bio.trim()) formData.append('bio', bio.trim());
      if (website.trim()) formData.append('website', website.trim());
      if ((user as any).location) formData.append('location', (user as any).location);

      const res = await updateProfile(formData);

      if (res.success) {
        toast.success('Identity saved! Now choose your feed topics.');
        await refreshSession();
        setCurrentStep(2);
      } else {
        toast.error(res.error || 'Failed to update profile');
      }
    } catch {
      toast.error('An error occurred updating profile');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handleToggleTopic = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleFinishOnboarding = async () => {
    if (!user) return;
    setIsSavingTopics(true);

    try {
      if (selectedIds.length > 0) {
        await fetch('/api/social/interests', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryIds: selectedIds }),
        });
      }

      localStorage.setItem(`onboarding_dismissed_${user.id}`, 'true');
      toast.success('Welcome aboard! Your VibeGrid feed is ready. 🚀');
      setIsOpen(false);
      router.refresh();
    } catch {
      toast.error('Failed to save topics');
    } finally {
      setIsSavingTopics(false);
    }
  };

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`onboarding_dismissed_${user.id}`, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen || !user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && handleDismiss()}>
      <DialogContent className="w-[95vw] sm:max-w-[560px] max-h-[85vh] flex flex-col p-4 sm:p-6 overflow-hidden rounded-2xl bg-card border-border/80 shadow-2xl">
        {/* Header with Step Tracker */}
        <DialogHeader className="shrink-0 pb-3 border-b border-border/40">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4 animate-pulse" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                {currentStep === 1 ? 'Step 1: Set Up Your Presence' : 'Step 2: Personalize Your Feed'}
              </DialogTitle>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
              {currentStep} / 2
            </span>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {currentStep === 1
              ? 'Tell the community who you are and what you build.'
              : 'Pick your favorite engineering topics to tune your recommendations.'}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 sm:pr-2 [overflow-wrap:anywhere]">
          {currentStep === 1 ? (
            <form id="onboarding-step-1" onSubmit={handleCompleteStep1} className="space-y-4">
              <div className="flex items-center gap-4">
                <UserAvatar src={user.image} name={displayName || user.name} className="size-16" />
                <div>
                  <p className="text-sm font-semibold">{displayName || user.name || 'Developer'}</p>
                  <p className="text-xs font-mono text-muted-foreground">@{user.username}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboarding-name" className="text-xs font-medium">Display Name</Label>
                <Input
                  id="onboarding-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Turing"
                  className="text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboarding-bio" className="text-xs font-medium">Bio</Label>
                <Textarea
                  id="onboarding-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Full-stack engineer building distributed systems & AI apps."
                  className="min-h-[80px] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboarding-website" className="text-xs font-medium">Website / GitHub</Label>
                <Input
                  id="onboarding-website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://github.com/alex"
                  className="text-sm break-all"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Select topics to follow. You can always change these anytime in Settings.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {categories.map((cat) => {
                  const isSelected = selectedIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleToggleTopic(cat.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground shadow-sm scale-102'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50'
                      }`}
                    >
                      {cat.emoji && <span>{cat.emoji}</span>}
                      <span>{cat.name}</span>
                      {isSelected && <Check className="size-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="shrink-0 pt-3 border-t border-border/40 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs text-muted-foreground">
            Skip for now
          </Button>

          {currentStep === 1 ? (
            <Button
              form="onboarding-step-1"
              type="submit"
              size="sm"
              disabled={isSubmittingProfile}
              className="gap-2 text-xs font-semibold"
            >
              Next: Choose Topics <ArrowRight className="size-3.5" />
            </Button>
          ) : (
            <Button
              onClick={handleFinishOnboarding}
              size="sm"
              disabled={isSavingTopics}
              className="gap-2 text-xs font-semibold"
            >
              Finish Setup <Check className="size-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
