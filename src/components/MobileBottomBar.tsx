"use client";
import { useSession } from "@/components/auth/SessionProvider";
import { Bell } from "lucide-react";
import Link from "next/link";
import { MobileDropVibeButton } from "./DropVibeButtons";
import { CustomSignOutButton } from "./CustomSignOutButton";

export function MobileBottomBar() {
  const { isAuthenticated, isLoading } = useSession();

  if (isLoading) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 nav-glass flex h-16 items-center justify-around px-4 pb-safe border-t border-border/50">
      {isAuthenticated ? (
        <>
          <MobileDropVibeButton />
          <button className="icon-button text-muted-foreground hover:text-primary transition-colors" aria-label="Notifications">
            <Bell className="size-5" />
          </button>
          <div className="scale-110">
            <CustomSignOutButton />
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

