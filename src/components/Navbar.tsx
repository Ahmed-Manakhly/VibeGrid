'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Mail, Search } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { VibeLogo } from './VibeLogo';
import { useSession } from '@/components/auth/SessionProvider';
import { MobileMenuButton } from './MobileMenuButton';
import { UserNavDropdown } from './UserNavDropdown';
import { DesktopDropVibeButton } from './DropVibeButtons';
import { SearchForm } from './SearchForm';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useRealtime } from '@/shared/infrastructure/socket/RealtimeProvider';

function Navbar() {
  const { user, isAuthenticated, isLoading } = useSession();
  const { unreadCount, unreadMessagesCount } = useRealtime();
  const pathname = usePathname();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { isVisible } = useScrollDirection({ threshold: 12, topOffset: 60 });

  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(path => pathname.startsWith(path));
  if (isAuthRoute) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex flex-col w-full transition-transform duration-300 ease-out will-change-transform",
        (isVisible || isMobileSearchOpen) ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="nav-glass flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-9">
        {/* Mobile In-Place Search Bar */}
        {isMobileSearchOpen ? (
          <div className="flex lg:hidden items-center w-full gap-2 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(false)}
              className="icon-button p-2 text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Close search"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="flex-1 min-w-0">
              <SearchForm
                variant="mobile"
                autoFocus
                onClose={() => setIsMobileSearchOpen(false)}
                onSearchSubmit={() => setIsMobileSearchOpen(false)}
              />
            </div>
          </div>
        ) : null}

        {/* Standard Navigation Bar Row */}
        <div className={cn(
          "flex items-center w-full gap-4",
          isMobileSearchOpen && "hidden lg:flex"
        )}>
          <MobileMenuButton />
          <div className="lg:hidden"><VibeLogo /></div>
          
          <SearchForm variant="inline" />
          
          <div className="ml-auto flex items-center gap-3">
            {/* Mobile Search Toggle Icon */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="icon-button lg:hidden text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open search"
            >
              <Search className="size-5" />
            </button>

            <ModeToggle />
            {!isLoading && (
              isAuthenticated && user ? (
                <>
                  <Link 
                    href="/messages" 
                    className="icon-button hidden lg:flex relative text-muted-foreground hover:text-foreground transition-colors" 
                    aria-label="Messages"
                  >
                    <Mail className="size-4" />
                    {unreadMessagesCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground animate-in zoom-in-50">
                        {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                      </span>
                    )}
                  </Link>
                  <Link 
                    href="/notifications" 
                    className="icon-button hidden lg:flex relative text-muted-foreground hover:text-foreground transition-colors" 
                    aria-label="Notifications"
                  >
                    <Bell className="size-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground animate-in zoom-in-50">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <DesktopDropVibeButton />
                  <div className="hidden lg:block pl-2 border-l border-border/50 ml-1">
                    <UserNavDropdown />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn-secondary hidden items-center justify-center px-4 py-2 text-sm lg:flex">
                    Sign up
                  </Link>
                  <Link href="/login" className="btn-gradient hidden items-center gap-2 px-4 py-2 text-sm lg:flex">
                    Log in
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;