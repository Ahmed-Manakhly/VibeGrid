'use client';

import { BellIcon, HomeIcon, UserIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { useSession } from "@/components/auth/SessionProvider";

function DesktopNavbar() {
  const { user, isAuthenticated, logout } = useSession();

  return (
    <div className="hidden md:flex items-center space-x-4">
      <ModeToggle />
      <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/5 hover:text-primary transition-all duration-300 rounded-full" asChild>
        <Link href="/">
          <HomeIcon className="w-4 h-4" />
          <span className="hidden lg:inline">Home</span>
        </Link>
      </Button>
      {isAuthenticated && user ? (
        <>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/5 hover:text-primary transition-all duration-300 rounded-full" asChild>
            <Link href="/notifications">
              <BellIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Notifications</span>
            </Link>
          </Button>
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/5 hover:text-primary transition-all duration-300 rounded-full" asChild>
            <Link href={`/profile/${user.username || user.name || user.email.split('@')[0]}`}>
              <UserIcon className="w-4 h-4" />
              <span className="hidden lg:inline">Profile</span>
            </Link>
          </Button>
          <Button variant="ghost" onClick={logout} className="flex items-center gap-2 text-destructive hover:bg-destructive/10 rounded-full">
            <LogOutIcon className="w-4 h-4" />
            <span className="hidden lg:inline">Log out</span>
          </Button>
        </>
      ) : (
        <Button variant="default" asChild>
          <Link href="/login">Log In</Link>
        </Button>
      )}
    </div>
  );
}
export default DesktopNavbar;