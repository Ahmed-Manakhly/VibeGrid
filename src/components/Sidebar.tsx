import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { Home, Compass, Layers, Users, Settings, MoreHorizontal } from 'lucide-react';
import { VibeLogo } from './VibeLogo';

export async function Sidebar({ active = 'Home' }: { active?: string }) {
  const user = await currentUser();

  const items = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Explore', icon: Compass, href: '#' },
    { label: 'Collections', icon: Layers, href: '#' },
    { label: 'People', icon: Users, href: '#' },
  ];

  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-r-0 surface-panel sticky top-0 h-screen overflow-y-auto z-20 p-6 rounded-none">
      <VibeLogo />
      
      <div className="mt-12 flex flex-col gap-2">
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
        
        {user && (
          <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-5">
            <div className="avatar avatar-teal">
                {user.firstName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">@{user.username || user.firstName}</p>
            </div>
            <MoreHorizontal className="ml-auto size-4 text-muted-foreground" />
          </div>
        )}
      </div>
    </aside>
  );
}
