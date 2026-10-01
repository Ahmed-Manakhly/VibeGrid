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
      {/* Background Neon Ambient Glow Orbs - Edge to Edge */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-accent/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 size-[600px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 size-[500px] rounded-full bg-accent/15 blur-[130px]" />
        
        {/* Subtle Cyberpunk Grid Overlay Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Auth Dedicated Fixed Topbar Header */}
      <AuthHeader />

      {/* Main Content Area: Doubled top padding for fixed header (pt-24 sm:pt-48), Edge-to-Edge Responsive Grid */}
      <main className="flex-1 w-full flex items-start justify-center pt-24 sm:pt-48 px-6 sm:px-24 lg:px-44 xl:px-64 pb-12 z-10">
        <div className="w-full flex flex-col-reverse lg:grid lg:grid-cols-12 gap-6 lg:gap-10 items-stretch">
          
          {/* Left Column: Visual Hero Panel (Desktop left, Mobile bottom order) */}
          <div className="w-full lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl backdrop-blur-2xl bg-card/25 border border-white/10 shadow-[0_0_50px_rgba(168,85,247,0.08)] relative overflow-hidden shrink-0">
            <div className="absolute -top-24 -left-24 size-48 rounded-full bg-accent/30 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 size-48 rounded-full bg-primary/30 blur-3xl" />

            {/* Back to grid link above the left card content */}
            <div className="mb-4 relative z-10">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-xs font-mono font-medium text-muted-foreground hover:text-foreground transition-all duration-300 group"
              >
                <span className="p-1.5 rounded-full bg-accent/10 group-hover:bg-accent/20 text-accent transition-colors">
                  <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                </span>
                <span>Back to the grid</span>
              </Link>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-xs font-mono font-semibold tracking-wider uppercase">
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

            {/* Feature Bullet Badges */}
            <div className="space-y-2.5 relative z-10 my-4 sm:my-6">
              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-background/40 border border-white/5 backdrop-blur-md">
                <div className="p-2 rounded-xl bg-accent/15 text-accent shrink-0">
                  <Zap className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Real-time Vibe Grid</p>
                  <p className="text-[11px] text-muted-foreground">Instant microservice signals</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-background/40 border border-white/5 backdrop-blur-md">
                <div className="p-2 rounded-xl bg-primary/15 text-primary shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">JWT & OAuth 2.0 Security</p>
                  <p className="text-[11px] text-muted-foreground">Multi-layer encryption</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-background/40 border border-white/5 backdrop-blur-md">
                <div className="p-2 rounded-xl bg-accent/15 text-accent shrink-0">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Developer-first Culture</p>
                  <p className="text-[11px] text-muted-foreground">Share code, tags & ideas</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground font-mono relative z-10">
              <span>VibeGrid v1.0</span>
              <span className="text-accent">● LIVE</span>
            </div>
          </div>

          {/* Right Column / Mobile Form Container: Glass Card (Mobile top order) */}
          <div className="w-full lg:col-span-7 flex flex-col justify-start shrink-0">
            <div className="w-full backdrop-blur-2xl bg-card/45 border border-accent/25 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(147,51,234,0.12)] relative">
              {children}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
