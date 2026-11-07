"use client";

import {
  BellIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  UserIcon,
  BookmarkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { useSession } from "@/components/auth/SessionProvider";
import { useRealtime } from "@/shared/infrastructure/socket/RealtimeProvider";

function MobileNavbar() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isAuthenticated, logout } = useSession();
  const { unreadCount } = useRealtime();

  return (
    <div className="flex md:hidden items-center space-x-2">
      <ModeToggle />
      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col space-y-4 mt-6">
            <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
              <Link href="/">
                <HomeIcon className="w-4 h-4" />
                Home
              </Link>
            </Button>

            {isAuthenticated ? (
              <>
                <Button variant="ghost" className="flex items-center gap-3 justify-start relative" asChild>
                  <Link href="/notifications">
                    <BellIcon className="w-4 h-4" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
                  <Link href="/profile">
                    <UserIcon className="w-4 h-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="ghost" className="flex items-center gap-3 justify-start" asChild>
                  <Link href="/bookmarks">
                    <BookmarkIcon className="w-4 h-4" />
                    Bookmarks
                  </Link>
                </Button>
                <Button variant="ghost" onClick={logout} className="flex items-center gap-3 justify-start w-full text-destructive">
                  <LogOutIcon className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="default" className="w-full" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default MobileNavbar;