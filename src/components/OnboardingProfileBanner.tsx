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
  const [dbProfile, setDbProfile] = useState<{ bio?: string | null; username?: string | null } | null>(null);
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
          user?.username ? fetch(`/api/profile?username=${encodeURIComponent(user.username)}`) : Promise.resolve(null),
        ]);

        if (interestRes.ok) {
          const interestData = await interestRes.json();
          if (interestData.success && Array.isArray(interestData.interests) && isMounted) {
            setSelectedInterestsCount(interestData.interests.length);
          }
        }

        if (profileRes && profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.user && isMounted) {
            setDbProfile(profileData.user);
          }
        }
      } catch (e) {
        console.error('Failed to load onboarding checklist state', e);
      }
    }

    loadOnboardingState();
    return () => {
      isMounted = false;
    };
  }, [shouldFetch, user?.username]);

  if (!shouldFetch) {
    return null;
  }

  // Evaluate the 3 Setup Tasks
  const task1AccountCreated = true; // Registered & authenticated
  const mergedUser = {
    ...user,
    bio: dbProfile?.bio ?? (user as any)?.bio,
    username: dbProfile?.username ?? user?.username,
  };

  const isProfileComplete = ProfileRules.isProfileComplete(mergedUser);
  const isPersonalizationComplete = selectedInterestsCount !== null && selectedInterestsCount > 0;

  // Once both remaining steps are complete, completely dismiss checklist
  if (isProfileComplete && isPersonalizationComplete) {
    return null;
  }

  // Calculate completion percentage
  let completedCount = 1; // Step 1 is complete
  if (isProfileComplete) completedCount += 1;
  if (isPersonalizationComplete) completedCount += 1;
  const progressPercent = Math.round((completedCount / 3) * 100);

  const profileEditHref = user?.username ? `/profile/${user.username}?edit=true` : '/settings?tab=profile';

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 xl:px-12 pt-4 pb-2">
      <div className="relative overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-card/45 backdrop-blur-3xl p-6 shadow-[0_20px_60px_-15px_rgba(4,120,87,0.08),0_10px_30px_-10px_rgba(216,182,92,0.14)] dark:shadow-[0_0_50px_rgba(4,120,87,0.15)] transition-all">
        {/* Ambient background glows matching login hero card */}
        <div className="pointer-events-none absolute -top-16 -left-16 size-48 rounded-full bg-[#d8b65c]/25 dark:bg-[#d8b65c]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 size-48 rounded-full bg-primary/25 dark:bg-primary/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#d8b65c]/15 border border-[#d8b65c]/30 text-[#d8b65c] shadow-[0_0_15px_rgba(216,182,92,0.2)] shrink-0">
                <Sparkles className="size-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight">
                    Welcome to VibeGrid! Complete your setup
                  </h3>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#d8b65c]/15 text-[#d8b65c] border border-[#d8b65c]/30 shadow-sm">
                    {completedCount} OF 3 COMPLETED
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Follow these essential steps to tune your recommendations and establish your developer presence.
                </p>
              </div>
            </div>

            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/60 transition-colors"
              aria-label="Dismiss checklist"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-secondary/80 dark:bg-muted/40 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#d8b65c] via-emerald-400 to-primary h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(216,182,92,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 3 Step Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Step 1: Account Created */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border border-primary/20 bg-background/50 backdrop-blur-md">
              <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground line-through opacity-75">
                  1. Account Verified
                </p>
                <p className="text-[11px] text-muted-foreground truncate font-mono">
                  Authentication active
                </p>
              </div>
            </div>

            {/* Step 2: Complete Profile Bio & Links */}
            <div
              className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                isProfileComplete
                  ? 'border-primary/20 bg-background/50 backdrop-blur-md'
                  : 'border-[#d8b65c]/40 bg-[#d8b65c]/5 hover:border-[#d8b65c]/70 shadow-sm backdrop-blur-md'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isProfileComplete ? (
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="size-5 text-[#d8b65c] animate-pulse shrink-0" />
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
                <Link
                  href={profileEditHref}
                  className="btn-gradient inline-flex items-center gap-1 px-3 py-1 rounded-xl font-semibold text-xs transition-all shrink-0 shadow-sm"
                >
                  <span>Edit</span>
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </div>

            {/* Step 3: Personalize Feed Interests */}
            <div
              className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                isPersonalizationComplete
                  ? 'border-primary/20 bg-background/50 backdrop-blur-md'
                  : 'border-[#d8b65c]/40 bg-[#d8b65c]/5 hover:border-[#d8b65c]/70 shadow-sm backdrop-blur-md'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isPersonalizationComplete ? (
                  <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="size-5 text-[#d8b65c] animate-pulse shrink-0" />
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
                <Link
                  href="/settings?tab=personalization"
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-secondary text-secondary-foreground border border-border/60 font-medium text-xs hover:bg-secondary/80 transition-all shrink-0"
                >
                  <span>Pick</span>
                  <ArrowRight className="size-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
