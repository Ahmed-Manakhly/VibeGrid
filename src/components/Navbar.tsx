'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { VibeLogo } from './VibeLogo';
import { useSession } from '@/components/auth/SessionProvider';
import { MobileMenuButton } from './MobileMenuButton';
import { UserNavDropdown } from './UserNavDropdown';
import { DesktopDropVibeButton } from './DropVibeButtons';
import { NavSearch, MobileNavSearch } from './NavSearch';

import { usePathname } from 'next/navigation';

function Navbar() {
  const { user, isAuthenticated, isLoading } = useSession();
  const pathname = usePathname();

  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(path => pathname.startsWith(path));
  if (isAuthRoute) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 flex flex-col w-full">
      <div className="nav-glass flex h-16 items-center gap-4 px-5 lg:px-9">
        <MobileMenuButton />
        <div className="lg:hidden"><VibeLogo /></div>
        
        <NavSearch />
        
        <div className="ml-auto flex items-center gap-3">
          <ModeToggle />
          {!isLoading && (
            isAuthenticated && user ? (
              <>
                <Link 
                  href="/notifications" 
                  className="icon-button hidden sm:flex" 
                  aria-label="Notifications"
                >
                  <Bell className="size-4" />
                </Link>
                <DesktopDropVibeButton />
                <div className="pl-2 border-l border-border/50 ml-1">
                  <UserNavDropdown />
                </div>
              </>
            ) : (
              <>
                <Link href="/register" className="btn-secondary hidden items-center justify-center px-4 py-2 text-sm sm:flex">
                  Sign up
                </Link>
                <Link href="/login" className="btn-gradient hidden items-center gap-2 px-4 py-2 text-sm sm:flex">
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