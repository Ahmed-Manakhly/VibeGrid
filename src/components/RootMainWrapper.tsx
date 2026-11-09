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
      {/* Background Ambient Glow & Cyberpunk Dual-Tone Dot Grid for Main App (Identical to Login Screen) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 size-[550px] rounded-full bg-[#d8b65c]/25 dark:bg-[#d8b65c]/20 blur-[130px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 size-[650px] rounded-full bg-primary/30 dark:bg-primary/25 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 size-[550px] rounded-full bg-[#d8b65c]/20 dark:bg-[#d8b65c]/15 blur-[130px]" />
        
        {/* Crisp Cyberpunk Grid Dots: Gold (36px) + Green (72px) Matrix (Kept Clean & Balanced) */}
        <div 
          className="absolute inset-0 opacity-40 dark:opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #d8b65c 1.1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
        <div 
          className="absolute inset-0 opacity-25 dark:opacity-15"
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
