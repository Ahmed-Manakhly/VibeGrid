'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/components/auth/SessionProvider';
import { Sparkles, ArrowRight, CheckCircle2, Circle, X } from 'lucide-react';
import { ProfileRules } from '@/modules/social/domain/ProfileRules';

export function OnboardingProfileBanner() {
  const { user, isAuthenticated, isLoading } = useSession();
  const [selectedInterestsCount, setSelectedInterestsCount] = useState<number | null>(null);
  const [dbProfile, setDbProfile] = useState<{ bio?: string | null; username?: string | null; isPolicyAccepted?: boolean } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  const isExcludedRoute = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ].some((route) => pathname.startsWith(route));

  const shouldFetch = !isLoading && isAuthenticated && Boolean(user) && !isExcludedRoute && !dismissed;

  useEffect(() => {
    if (!shouldFetch) return;

    let isMounted = true;
    async function loadOnboardingState() {
      try {
        const [interestRes, profileRes] = await Promise.all([
          fetch('/api/social/interests'),
          fetch('/api/profile'),
        ]);

        if (interestRes.ok) {
          const interestData = await interestRes.json();
          if (interestData.success && Array.isArray(interestData.interests) && isMounted) {
            setSelectedInterestsCount(interestData.interests.length);
          }
        }

        if (profileRes && profileRes.ok) {
          const profileData = await profileRes.json();
          const p = profileData.profile || profileData.user;
          if (p && isMounted) {
            setDbProfile(p);
          }
        }
      } catch (e) {
        console.error('Failed to load onboarding checklist state', e);
      }
    }

    loadOnboardingState();

    const handleInterestsUpdated = () => {
      loadOnboardingState();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('interests_updated', handleInterestsUpdated);
      window.addEventListener('session_updated', handleInterestsUpdated);
      window.addEventListener('policy-accepted-success', handleInterestsUpdated);
    }

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('interests_updated', handleInterestsUpdated);
        window.removeEventListener('session_updated', handleInterestsUpdated);
        window.removeEventListener('policy-accepted-success', handleInterestsUpdated);
      }
    };
  }, [shouldFetch, user?.username, user?.bio]);

  if (!shouldFetch) {
    return null;
  }

  // Evaluate Setup Tasks
  const isPolicyAccepted = dbProfile?.isPolicyAccepted ?? (user as any)?.isPolicyAccepted ?? false;
  const mergedUser = {
    ...user,
    bio: dbProfile?.bio ?? (user as any)?.bio,
    username: dbProfile?.username ?? user?.username,
  };

  const isProfileComplete = ProfileRules.isProfileComplete(mergedUser);
  const isPersonalizationComplete = selectedInterestsCount !== null && selectedInterestsCount > 0;

  // Once all steps are complete, completely dismiss checklist
  if (isPolicyAccepted && isProfileComplete && isPersonalizationComplete) {
    return null;
  }

  // Calculate completion percentage
  let completedCount = 0;
  if (isPolicyAccepted) completedCount += 1;
  if (isProfileComplete) completedCount += 1;
  if (isPersonalizationComplete) completedCount += 1;
  const progressPercent = Math.round((completedCount / 3) * 100);

  const profileEditHref = user?.username ? `/profile/${user.username}?edit=true` : '/settings?tab=profile';

  return (
    <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-8 xl:px-12 pt-3 pb-2">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-card/45 backdrop-blur-3xl p-3 sm:p-6 shadow-[0_20px_60px_-15px_rgba(4,120,87,0.08),0_10px_30px_-10px_rgba(216,182,92,0.14)] dark:shadow-[0_0_50px_rgba(4,120,87,0.15)] transition-all">
        {/* Ambient background glows matching login hero card */}
        <div className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-brand-gold/25 dark:bg-brand-gold/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-primary/25 dark:bg-primary/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
          {/* Top Dismiss Button Row for Mobile */}
          <div className="flex justify-end sm:hidden -mb-2">
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/60 transition-colors"
              aria-label="Dismiss checklist"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-primary/15 border border-primary/30 text-primary shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0 mt-0.5">
                <Sparkles className="size-4 sm:size-5 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight leading-snug">
                    Welcome to VibeGrid! Complete your setup
                  </h3>
                  <span className="self-start text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 shadow-sm shrink-0">
                    {completedCount} OF 3 COMPLETED
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Follow these essential steps to tune your recommendations and establish your developer presence.
                </p>
              </div>
            </div>

            <button
              onClick={() => setDismissed(true)}
              className="hidden sm:inline-flex text-xs text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60 transition-colors shrink-0"
              aria-label="Dismiss checklist"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary/80 dark:bg-muted/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-gold via-emerald-400 to-primary h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(216,182,92,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 3 Step Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Step 1: Platform Policy Acceptance */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                isPolicyAccepted
                  ? 'border-primary/20 bg-background/50 backdrop-blur-md'
                  : 'border-brand-gold/40 bg-brand-gold/5 hover:border-brand-gold/70 shadow-sm backdrop-blur-md'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isPolicyAccepted ? (
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="size-5 text-brand-gold animate-pulse shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold ${
                      isPolicyAccepted ? 'line-through opacity-75 text-foreground' : 'text-foreground'
                    }`}
                  >
                    1. Platform Policy
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate font-mono">
                    {isPolicyAccepted ? 'Policy Accepted' : 'Terms & Privacy gate'}
                  </p>
                </div>
              </div>

              {!isPolicyAccepted && (
                <div className="flex justify-end pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-policy-prompt'));
                      }
                    }}
                    className="btn-gradient inline-flex items-center justify-center gap-1 px-3 py-1 rounded-xl font-semibold text-xs transition-all w-full sm:w-auto shadow-sm cursor-pointer"
                  >
                    <span>Accept</span>
                    <ArrowRight className="size-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Complete Profile Bio & Links */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                isProfileComplete
                  ? 'border-primary/20 bg-background/50 backdrop-blur-md'
                  : 'border-brand-gold/40 bg-brand-gold/5 hover:border-brand-gold/70 shadow-sm backdrop-blur-md'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isProfileComplete ? (
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="size-5 text-brand-gold animate-pulse shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold ${
                      isProfileComplete ? 'line-through opacity-75 text-foreground' : 'text-foreground'
                    }`}
                  >
                    2. Complete Profile
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {isProfileComplete ? 'Bio & handle configured' : 'Add bio, handle & links'}
                  </p>
                </div>
              </div>

              {!isProfileComplete && (
                <div className="flex justify-end pt-1 sm:pt-0">
                  <Link
                    href={profileEditHref}
                    className="btn-gradient inline-flex items-center justify-center gap-1 px-3 py-1 rounded-xl font-semibold text-xs transition-all w-full sm:w-auto shadow-sm"
                  >
                    <span>Edit</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Step 3: Personalize Feed Interests */}
            <div
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                isPersonalizationComplete
                  ? 'border-primary/20 bg-background/50 backdrop-blur-md'
                  : 'border-brand-gold/40 bg-brand-gold/5 hover:border-brand-gold/70 shadow-sm backdrop-blur-md'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isPersonalizationComplete ? (
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="size-5 text-brand-gold animate-pulse shrink-0" />
                )}
                <div className="min-w-0">
                  <p
                    className={`text-xs font-semibold ${
                      isPersonalizationComplete ? 'line-through opacity-75 text-foreground' : 'text-foreground'
                    }`}
                  >
                    3. Personalize Feed
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {isPersonalizationComplete
                      ? `${selectedInterestsCount} topics selected`
                      : 'Pick 3+ technologies'}
                  </p>
                </div>
              </div>

              {!isPersonalizationComplete && (
                <div className="flex justify-end pt-1 sm:pt-0">
                  <Link
                    href="/settings?tab=personalization"
                    className="inline-flex items-center justify-center gap-1 px-3 py-1 rounded-xl bg-secondary text-secondary-foreground border border-border/60 font-medium text-xs hover:bg-secondary/80 transition-all w-full sm:w-auto shrink-0"
                  >
                    <span>Pick</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
