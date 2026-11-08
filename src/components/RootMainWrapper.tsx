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
    <div className="relative min-h-[calc(100vh-64px)] w-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]">
      <OnboardingProfileBanner />
      <main className="px-4 py-6 lg:px-8 xl:px-12 w-full max-w-[1600px] mx-auto pb-28 lg:pb-12">
        {children}
      </main>
    </div>
  );
}
