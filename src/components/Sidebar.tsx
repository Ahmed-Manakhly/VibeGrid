import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { Home, Bell, User, Settings, LogOut, Search, Mail, Bookmark, Users } from 'lucide-react';
import { VibeLogo } from './VibeLogo';
import { SignOutButton } from "@clerk/nextjs";
import { getUserByClerkId } from '@/actions/user.action';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

export async function Sidebar({ active = 'Home' }: { active?: string }) {
  const authUser = await currentUser();
  const dbUser = authUser ? await getUserByClerkId(authUser.id) : null;

  const items = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Explore', icon: Search, href: '/explore' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Profile', icon: User, href: authUser ? `/profile/${dbUser?.username || authUser.username || authUser.firstName}` : '/login' },
    { label: 'Messages', icon: Mail, href: '/messages' },
    { label: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
    { label: 'Communities', icon: Users, href: '/communities' },
  ];

  return (
    <>
      <div className="mb-8 pl-2 scale-110 origin-left group-[.is-collapsed]:mt-4 group-[.is-collapsed]:ml-1">
        <VibeLogo />
      </div>

      {/* Top user card removed to avoid duplication */}
      
      <div className="flex flex-col gap-2">
        {items.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} className={`nav-item ${active === label ? 'nav-item-active' : ''}`}>
            <Icon className="size-5 shrink-0" /><span className="group-[.is-collapsed]:hidden">{label}</span>
          </Link>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Link href="#" className="nav-item">
            <Settings className="size-5 shrink-0" /><span className="group-[.is-collapsed]:hidden">Settings</span>
        </Link>
        
        {dbUser && (
          <div className="mt-4 relative group">
            <Link href={`/profile/${dbUser.username}`} className="block hover:opacity-90 transition-opacity">
              <div className="flex flex-col gap-4 border border-border/60 p-4 group-[.is-collapsed]:p-2 group-[.is-collapsed]:items-center rounded-2xl group-[.is-collapsed]:rounded-full bg-card/40 group-[.is-collapsed]:border-transparent">
                <div className="flex items-center gap-3">
                  <Avatar className="shrink-0 transition-all">
                      <AvatarImage src={dbUser.image || ""} alt={dbUser.name} />
                      <AvatarFallback>{authUser?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 group-[.is-collapsed]:hidden">
                      <p className="truncate text-sm font-medium">{dbUser.name}</p>
                      <p className="truncate font-mono text-[10px] text-muted-foreground">@{dbUser.username}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-center px-1 group-[.is-collapsed]:hidden">
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
            </Link>
            <div className="absolute top-4 right-4 opacity-100 z-10 group-[.is-collapsed]:hidden">
              <SignOutButton>
                <button className="p-1.5 hover:bg-destructive/10 rounded-full transition-colors text-muted-foreground hover:text-destructive shrink-0">
                  <LogOut className="size-3.5" />
                </button>
              </SignOutButton>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
