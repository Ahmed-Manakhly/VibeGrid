import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { Home, Bell, User, Settings, LogOut, Search, Mail, Bookmark, Users } from 'lucide-react';
import { VibeLogo } from './VibeLogo';
import { SignOutButton } from "@clerk/nextjs";
import { getUserByClerkId } from '@/actions/user.action';

export async function Sidebar({ active = 'Home' }: { active?: string }) {
  const authUser = await currentUser();
  const dbUser = authUser ? await getUserByClerkId(authUser.id) : null;

  const items = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Explore', icon: Search, href: '/explore' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Messages', icon: Mail, href: '/messages' },
    { label: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
    { label: 'Communities', icon: Users, href: '/communities' },
  ];

  return (
    <>
      <div className="mb-8 pl-2 scale-110 origin-left">
        <VibeLogo />
      </div>

      {authUser && (
        <div className="mb-8 flex items-center gap-3 border border-border/60 p-3 rounded-2xl bg-card/40">
          <div className="avatar avatar-teal">
              {authUser.firstName?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{authUser.firstName} {authUser.lastName}</p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">@{authUser.username || authUser.firstName}</p>
          </div>
          <SignOutButton>
            <button className="p-2 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive shrink-0">
              <LogOut className="size-4" />
            </button>
          </SignOutButton>
        </div>
      )}
      
      <div className="flex flex-col gap-2">
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
        
        {dbUser && (
          <div className="mt-4 flex flex-col gap-4 border border-border/60 p-4 rounded-2xl bg-card/40">
            <div className="flex items-center gap-3">
              <div className="avatar avatar-teal">
                  {dbUser.image ? (
                    <img src={dbUser.image} alt={dbUser.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    authUser?.firstName?.charAt(0) || 'U'
                  )}
              </div>
              <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{dbUser.name}</p>
                  <p className="truncate font-mono text-[10px] text-muted-foreground">@{dbUser.username}</p>
              </div>
            </div>
            <div className="flex justify-between items-center text-center px-1">
              <div>
                <p className="text-sm font-bold text-primary">0</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">Vibe Score</p>
              </div>
              <div>
                <p className="text-sm font-bold">{dbUser._count?.followers || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">Followers</p>
              </div>
              <div>
                <p className="text-sm font-bold">{dbUser._count?.following || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">Following</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
