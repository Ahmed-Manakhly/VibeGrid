"use client";
import { useSession } from "@/components/auth/SessionProvider";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSidebar } from "./SidebarContext";
import { MobileDropVibeButton } from "./DropVibeButtons";
import { CustomSignOutButton } from "./CustomSignOutButton";

import { usePathname } from 'next/navigation';

export function MobileBottomBar() {
  const { user, isAuthenticated, isLoading } = useSession();
  const { toggle } = useSidebar();
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register' || isLoading) return null;

  const displayName = user?.name || user?.email.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 nav-glass flex h-16 items-center justify-around px-4 pb-safe border-t border-border/50">
      {isAuthenticated ? (
        <>
          <MobileDropVibeButton />
          <Link href="/notifications" className="icon-button text-muted-foreground hover:text-primary transition-colors" aria-label="Notifications">
            <Bell className="size-5" />
          </Link>
          <button onClick={toggle} aria-label="Open sidebar menu" className="p-0.5 rounded-full hover:ring-2 hover:ring-primary/50 transition-all outline-none">
            <Avatar className="size-8">
              <AvatarImage src="/avatar.png" alt={displayName} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
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

