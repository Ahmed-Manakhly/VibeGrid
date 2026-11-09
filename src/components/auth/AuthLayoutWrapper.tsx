'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/auth/SessionProvider';
import { useRouter } from 'next/navigation';
import { AuthHeader } from './AuthHeader';
import AuthLoadingSkeleton from './AuthLoadingSkeleton';
import { Sparkles, Radio, Zap, ShieldCheck, ArrowLeft } from 'lucide-react';

import Loading from '@/app/loading';

interface AuthLayoutWrapperProps {
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}

export function AuthLayoutWrapper({
  title,
  subtitle,
  badge = 'VIBEGRID SIGNAL',
  children,
}: AuthLayoutWrapperProps) {
  const { isAuthenticated, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isAuthenticated) {
    return <AuthLoadingSkeleton />;
  }

  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background relative selection:bg-accent selection:text-white">
      {/* Background Ambient Glow Orbs & Dual-Tone Depth Orbits */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 size-[550px] rounded-full bg-[#d8b65c]/25 dark:bg-[#d8b65c]/20 blur-[130px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 size-[650px] rounded-full bg-primary/30 dark:bg-primary/25 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 size-[550px] rounded-full bg-[#d8b65c]/20 dark:bg-[#d8b65c]/15 blur-[130px]" />
        
        {/* Crisp Cyberpunk Grid Dots Pattern: Gold + Green Dual Matrix */}
        <div 
          className="absolute inset-0 opacity-45 dark:opacity-50"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #d8b65c 1.2px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-35"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: '72px 72px'
          }}
        />
      </div>

      {/* Auth Dedicated Fixed Topbar Header */}
      <AuthHeader />

      {/* Main Content Area: Doubled top padding for fixed header (pt-24 sm:pt-48), Edge-to-Edge Responsive Grid */}
      <main className="flex-1 w-full flex items-start justify-center pt-24 sm:pt-48 px-6 sm:px-24 lg:px-44 xl:px-64 pb-12 z-10">
        <div className="w-full flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
          
          {/* Left Column: Visual Hero Panel (Desktop left, Mobile bottom order) */}
          <div className="w-full lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl backdrop-blur-3xl bg-white/70 dark:bg-card/25 border border-white/60 dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(4,120,87,0.12),0_10px_30px_-10px_rgba(216,182,92,0.18)] dark:shadow-[0_0_50px_rgba(216,182,92,0.08)] relative overflow-hidden shrink-0">
            <div className="absolute -top-24 -left-24 size-48 rounded-full bg-[#d8b65c]/30 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-primary/35 blur-3xl" />

            {/* Back to grid link above the left card content */}
            <div className="mb-4 relative z-10">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-all duration-300 group"
              >
                <span className="p-1.5 rounded-full bg-[#d8b65c]/10 group-hover:bg-[#d8b65c]/20 text-[#d8b65c] transition-colors">
                  <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                </span>
                <span>Back to the grid</span>
              </Link>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8b65c]/15 border border-[#d8b65c]/30 text-[#d8b65c] text-xs font-mono font-semibold tracking-wider uppercase">
                <Radio className="size-3.5 animate-pulse" />
                <span>{badge}</span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  {title}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Feature Bullet Badges: Dev-First Social Media & Code Playground Positioning */}
            <div className="space-y-2.5 relative z-10 my-4 sm:my-6">
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/60 dark:bg-background/40 border border-emerald-900/10 dark:border-white/5 shadow-sm backdrop-blur-md">
                <div className="p-2 rounded-xl bg-[#d8b65c]/15 text-[#d8b65c] shrink-0">
                  <Zap className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Live Developer Pulse</p>
                  <p className="text-[11px] text-muted-foreground">Real-time code telemetry & trending dev vibes</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/60 dark:bg-background/40 border border-emerald-900/10 dark:border-white/5 shadow-sm backdrop-blur-md">
                <div className="p-2 rounded-xl bg-primary/15 text-primary shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Verified Proof of Work</p>
                  <p className="text-[11px] text-muted-foreground">Showcase real ships, commit vibes & tech dilemmas</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/60 dark:bg-background/40 border border-emerald-900/10 dark:border-white/5 shadow-sm backdrop-blur-md">
                <div className="p-2 rounded-xl bg-[#d8b65c]/15 text-[#d8b65c] shrink-0">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">The Builder Sanctuary</p>
                  <p className="text-[11px] text-muted-foreground">High-signal community built exclusively for engineers</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border/70 dark:border-white/10 flex items-center justify-between text-xs text-muted-foreground font-mono relative z-10">
              <span>VibeGrid v1.0</span>
              <span className="text-[#d8b65c]">● LIVE</span>
            </div>
          </div>

          {/* Right Column / Mobile Form Container: Glass Card (Mobile top order) */}
          <div className="w-full lg:col-span-7 flex flex-col justify-start shrink-0">
            <div className="w-full backdrop-blur-3xl bg-white/70 dark:bg-card/45 border border-white/60 dark:border-primary/25 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06),0_10px_30px_-10px_rgba(4,120,87,0.12)] dark:shadow-[0_0_50px_rgba(4,120,87,0.15)] relative">
              {children}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
