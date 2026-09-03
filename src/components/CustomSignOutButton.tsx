"use client";

import { LogOut } from "lucide-react";
import { useSession } from "@/components/auth/SessionProvider";

export function CustomSignOutButton() {
  const { logout } = useSession();

  return (
    <div
      role="button"
      onClick={logout}
      className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive shrink-0 cursor-pointer"
      title="Sign Out"
    >
      <LogOut className="size-3.5" />
    </div>
  );
}

