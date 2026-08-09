import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { Home, Bell, User, Settings, LogOut } from 'lucide-react';
import { VibeLogo } from './VibeLogo';
import { SignOutButton } from "@clerk/nextjs";

export async function Sidebar({ active = 'Home' }: { active?: string }) {
  const user = await currentUser();

  const items = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Profile', icon: User, href: user ? `/profile/${user.username ?? user.emailAddresses[0].emailAddress.split("@")[0]}` : '/login' },
  ];

  return (
    <>
      <div className="mb-8 pl-2 scale-110 origin-left">
        <VibeLogo />
      </div>

      {user && (
        <div className="mb-10 flex items-center gap-3 border border-border/60 p-3 rounded-2xl bg-card/40">
          <div className="avatar avatar-teal">
              {user.firstName?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.firstName} {user.lastName}</p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">@{user.username || user.firstName}</p>
          </div>
          <SignOutButton>
            <button className="p-2 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive shrink-0">
              <LogOut className="size-4" />
            </button>
          </SignOutButton>
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Navigate</p>
        {items.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} className={`nav-item ${active === label ? 'nav-item-active' : ''}`}>
            <Icon className="size-4" />{label}
          </Link>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Link href="#" className="nav-item">
            <Settings className="size-4" />Settings
        </Link>
      </div>
    </>
  );
}
