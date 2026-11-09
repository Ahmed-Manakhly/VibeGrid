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
        {/* Prominent Golden Light Bloom from Top-Left */}
        <div className="absolute -top-24 -left-24 size-[750px] rounded-full bg-[#d8b65c]/38 dark:bg-[#d8b65c]/28 blur-[130px] animate-pulse" />
        <div className="absolute top-0 left-0 size-[500px] rounded-full bg-[#d8b65c]/28 dark:bg-[#d8b65c]/22 blur-[90px]" />
        
        {/* Mirrored Vibrant Emerald Light Bloom from Bottom-Right */}
        <div className="absolute -bottom-24 -right-24 size-[800px] rounded-full bg-primary/40 dark:bg-primary/32 blur-[130px] animate-pulse" />
        <div className="absolute bottom-0 right-0 size-[520px] rounded-full bg-primary/30 dark:bg-primary/24 blur-[90px]" />
        
        {/* Additional Mid-Depth Ambient Soft Blooms */}
        <div className="absolute top-1/2 -right-40 size-[600px] rounded-full bg-primary/20 dark:bg-primary/15 blur-[150px]" />
        <div className="absolute -bottom-40 left-1/4 size-[500px] rounded-full bg-[#d8b65c]/18 dark:bg-[#d8b65c]/12 blur-[140px]" />
        
        {/* Crisp Cyberpunk Grid Dots: Gold (36px) + Green (72px) Matrix */}
        <div 
          className="absolute inset-0 opacity-45 dark:opacity-25"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #d8b65c 1.1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-20"
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
