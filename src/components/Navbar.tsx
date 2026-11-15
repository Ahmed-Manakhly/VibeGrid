'use client';

import Link from 'next/link';
import { Bell, Mail } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { VibeLogo } from './VibeLogo';
import { useSession } from '@/components/auth/SessionProvider';
import { MobileMenuButton } from './MobileMenuButton';
import { UserNavDropdown } from './UserNavDropdown';
import { DesktopDropVibeButton } from './DropVibeButtons';
import { SearchForm, MobileNavSearch } from './SearchForm';

import { usePathname } from 'next/navigation';

import { useRealtime } from '@/shared/infrastructure/socket/RealtimeProvider';

function Navbar() {
  const { user, isAuthenticated, isLoading } = useSession();
  const { unreadCount, unreadMessagesCount } = useRealtime();
  const pathname = usePathname();

  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(path => pathname.startsWith(path));
  if (isAuthRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 flex flex-col w-full">
      <div className="nav-glass flex h-16 items-center gap-4 px-4 sm:px-6 lg:px-9">
        <MobileMenuButton />
        <div className="lg:hidden"><VibeLogo /></div>
        
        <SearchForm variant="inline" />
        
        <div className="ml-auto flex items-center gap-3">
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

      {/* Mobile Search Bar */}
      <MobileNavSearch />
    </header>
  );
}

export default Navbar;