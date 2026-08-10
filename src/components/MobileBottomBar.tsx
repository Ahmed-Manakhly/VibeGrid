"use client";
import { UserButton, useUser } from "@clerk/nextjs";
import { Bell, Plus } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import Link from "next/link";
import { MobileDropVibeButton } from "./DropVibeButtons";

export function MobileBottomBar() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 nav-glass flex h-16 items-center justify-around px-4 pb-safe border-t border-border/50">
      {isSignedIn ? (
        <>
          <MobileDropVibeButton />
          <button className="icon-button text-muted-foreground hover:text-primary transition-colors" aria-label="Notifications">
            <Bell className="size-5" />
          </button>
          <div className="scale-110">
            <UserButton />
          </div>
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
