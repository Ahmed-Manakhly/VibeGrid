import { UserButton } from "@clerk/nextjs";
import { Bell, Plus } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

export async function MobileBottomBar() {
  const user = await currentUser();

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 nav-glass flex h-16 items-center justify-around px-4 pb-safe border-t border-border/50">
      <Link href="/" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
        <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-lg -mt-6 hover:bg-primary/90 transition-colors">
          <Plus className="size-5" />
        </div>
      </Link>
      
      <button className="icon-button text-muted-foreground hover:text-foreground transition-colors" aria-label="Notifications">
        <Bell className="size-5" />
      </button>

      <ModeToggle />

      {user ? (
        <div className="scale-110">
          <UserButton />
        </div>
      ) : (
        <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          Log in
        </Link>
      )}
    </div>
  );
}
