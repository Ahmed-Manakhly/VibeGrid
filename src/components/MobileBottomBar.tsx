"use client";
import { useSession } from "@/components/auth/SessionProvider";
import { Bell, Mail } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "./UserAvatar";
import { useSidebar } from "./SidebarContext";
import { MobileDropVibeButton } from "./DropVibeButtons";
import { CustomSignOutButton } from "./CustomSignOutButton";
import { useRealtime } from "@/shared/infrastructure/socket/RealtimeProvider";

import { usePathname } from 'next/navigation';

export function MobileBottomBar() {
  const { user, isAuthenticated, isLoading } = useSession();
  const { toggle } = useSidebar();
  const { unreadCount, unreadMessagesCount } = useRealtime();
  const pathname = usePathname();

  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].some(path => pathname.startsWith(path));
  if (isAuthRoute || isLoading) return null;

  const displayName = user?.name || user?.email.split('@')[0] || 'User';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 nav-glass flex h-16 items-center justify-around px-8 sm:px-12 pb-safe border-t border-border/50">
      {isAuthenticated ? (
        <>
          <MobileDropVibeButton />
          <Link href="/messages" className="icon-button relative text-muted-foreground hover:text-accent transition-colors" aria-label="Messages">
            <Mail className="size-5" />
            {unreadMessagesCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
              </span>
            )}
          </Link>
          <Link href="/notifications" className="icon-button relative text-muted-foreground hover:text-accent transition-colors" aria-label="Notifications">
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <button onClick={toggle} aria-label="Open sidebar menu" className="p-0.5 rounded-full outline-none">
            <UserAvatar src={user?.image} name={displayName} className="size-8" />
          </button>
        </>
      ) : (
        <>
          <Link href="/register" className="btn-secondary px-4 py-1.5 text-sm font-semibold rounded-xl">
            Sign up
          </Link>
          <Link href="/login" className="btn-gradient px-4 py-1.5 text-sm font-semibold rounded-xl">
            Log in
          </Link>
        </>
      )}
    </div>
  );
}

