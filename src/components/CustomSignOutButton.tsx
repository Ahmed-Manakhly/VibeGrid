"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export function CustomSignOutButton() {
  return (
    <SignOutButton>
      <div role="button" className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive shrink-0 cursor-pointer">
        <LogOut className="size-3.5" />
      </div>
    </SignOutButton>
  );
}
