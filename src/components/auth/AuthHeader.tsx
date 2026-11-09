'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { VibeLogo } from '@/components/VibeLogo';
import { ModeToggle } from '@/components/ModeToggle';

export function AuthHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 w-full h-16 px-4 sm:px-8 lg:px-16 xl:px-32 flex items-center justify-between z-50 backdrop-blur-xl bg-background/40 border-b border-white/5 shadow-sm shrink-0">
      <div className="flex items-center gap-3">
        <VibeLogo />
      </div>

      <div className="flex items-center gap-3">
        <ModeToggle />
      </div>
    </header>
  );
}
