'use client';

import { usePathname } from 'next/navigation';
import { OnboardingProfileBanner } from '@/components/OnboardingProfileBanner';

export function RootMainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(path => pathname.startsWith(path));

  if (isAuthRoute) {
    return <div className="w-full min-h-screen p-0 m-0">{children}</div>;
  }

  return (
    <>
      {/* Background Ambient Glow & Cyberpunk Dual-Tone Dot Grid for Main App */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Enhanced High-Intensity Gold Aurora Bloom from Top-Left */}
        <div className="absolute -top-32 -left-32 size-[700px] rounded-full bg-[#d8b65c]/35 dark:bg-[#d8b65c]/30 blur-[140px] animate-pulse" />
        <div className="absolute top-0 left-0 size-[450px] rounded-full bg-[#d8b65c]/25 dark:bg-[#d8b65c]/20 blur-[100px]" />
        
        {/* Emerald Ambient Depth Blooms */}
        <div className="absolute top-1/3 -right-40 size-[700px] rounded-full bg-primary/25 dark:bg-primary/20 blur-[160px]" />
        <div className="absolute -bottom-40 left-1/4 size-[600px] rounded-full bg-[#d8b65c]/20 dark:bg-[#d8b65c]/15 blur-[140px]" />
        
        {/* Crisp Cyberpunk Grid Dots: Gold (36px) + Green (72px) Matrix */}
        <div 
          className="absolute inset-0 opacity-50 dark:opacity-55"
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

      <div className="relative z-10 w-full">
        <OnboardingProfileBanner />
        <main className="px-4 py-8 lg:px-8 xl:px-12 w-full max-w-[1600px] mx-auto pb-24 sm:pb-8">
          {children}
        </main>
      </div>
    </>
  );
}
