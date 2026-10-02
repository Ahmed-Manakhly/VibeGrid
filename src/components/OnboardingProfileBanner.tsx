'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/components/auth/SessionProvider';
import { Sparkles, ArrowRight, X } from 'lucide-react';

import { ProfileRules } from '@/modules/social/domain/ProfileRules';

export function OnboardingProfileBanner() {
  const { user, isAuthenticated, isLoading } = useSession();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string; emoji: string | null }>>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [interestsLoaded, setInterestsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // Do not display banner on auth pages
  const isExcludedRoute = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ].some((route) => pathname.startsWith(route));

  if (isLoading || !isAuthenticated || !user || isExcludedRoute || dismissed) {
    return null;
  }

  const isComplete = ProfileRules.isProfileComplete(user);

  // Load user's interests and taxonomy categories on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [interestRes, catRes] = await Promise.all([
          fetch('/api/social/interests'),
          fetch('/api/taxonomy/categories'),
        ]);
        if (interestRes.ok) {
          const data = await interestRes.json();
          if (data.success && Array.isArray(data.interests)) {
            setSelectedIds(data.interests.map((i: any) => i.id));
          }
        }
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.success && Array.isArray(catData.categories)) {
            setCategories(catData.categories);
          }
        }
      } catch (e) {
        console.error('Failed to load onboarding data', e);
      } finally {
        setInterestsLoaded(true);
      }
    }
    loadData();
  }, []);

  // Helper to toggle category selection
  const toggleCategory = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // Submit selected interests
  const saveInterests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/interests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds: selectedIds }),
      });
      if (!res.ok) {
        throw new Error('Failed to save interests');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // If profile is incomplete, show the original completion banner
  if (!isComplete) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 xl:px-12 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-card/60 backdrop-blur-xl p-4 sm:p-5 shadow-xl shadow-accent/5 transition-all">
          {/* Ambient Glow Orbs */}
          <div className="pointer-events-none absolute -top-12 -left-12 size-36 rounded-full bg-accent/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 size-36 rounded-full bg-primary/20 blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-accent/15 border border-accent/30 text-accent shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="size-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base text-foreground tracking-tight">
                    Complete your VibeGrid Profile
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30">
                    ACTION REQUIRED
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  You are using a temporary handle. Set up your custom handle and display name to unlock creator features.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
              <Link
                href={user.username ? `/profile/${user.username}?edit=true` : '/login'}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs sm:text-sm shadow-md shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Complete Profile</span>
                <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="p-2 rounded-xl border border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Dismiss notification"
                aria-label="Dismiss banner"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Profile is complete – wait for interests to load
  if (!interestsLoaded) {
    return null;
  }

  // If user has no interests selected, show interest selection UI
  if (selectedIds.length === 0) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 lg:px-8 xl:px-12 pt-4 pb-2">
        <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-card/60 backdrop-blur-xl p-4 sm:p-5 shadow-xl shadow-accent/5 transition-all">
          <div className="pointer-events-none absolute -top-12 -left-12 size-36 rounded-full bg-accent/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 -right-12 size-36 rounded-full bg-primary/20 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-foreground">Select Your Interests</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-2 rounded-xl border ${selectedIds.includes(cat.id) ? 'bg-accent text-accent-foreground' : 'bg-muted'} transition-colors`}
                >
                  {cat.emoji ? <span className="mr-1">{cat.emoji}</span> : null}
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveInterests}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Interests'}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-2 rounded-xl border border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Dismiss"
                aria-label="Dismiss banner"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interests are set – nothing to show
  return null;
}
