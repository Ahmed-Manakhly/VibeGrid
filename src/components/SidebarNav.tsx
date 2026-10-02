"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, Settings, Search, Mail, Bookmark, Users } from 'lucide-react';
import { useSidebar } from './SidebarContext';

interface SidebarNavProps {
  profileHref: string;
}

type NavMatch =
  | { type: 'exact' }
  | { type: 'segment-prefix'; base?: string };

interface NavItem {
  label: string;
  icon: any;
  href: string;
  match?: NavMatch;
}

function isRouteActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  const match = item.match ?? (item.href === '/' ? { type: 'exact' } : { type: 'segment-prefix' });

  if (match.type === 'exact') {
    return pathname === item.href;
  }

  const base = match.base ?? item.href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function SidebarNav({ profileHref }: SidebarNavProps) {
  const pathname = usePathname();
  const { close } = useSidebar();

  const items: NavItem[] = [
    { label: 'Home', icon: Home, href: '/', match: { type: 'exact' } },
    { label: 'Explore', icon: Search, href: '/explore' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Profile', icon: User, href: profileHref, match: { type: 'segment-prefix', base: '/profile' } },
    { label: 'Messages', icon: Mail, href: '/messages' },
    { label: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
    { label: 'Communities', icon: Users, href: '/communities' },
  ];

  return (
    <>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const { label, icon: Icon, href } = item;
          const isActive = isRouteActive(pathname, item);

          return (
            <Link 
              key={label} 
              href={href} 
              onClick={() => {
                if (window.innerWidth < 1024) close();
              }}
              className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon className="size-5 shrink-0" /><span className="lg:group-[.is-collapsed]:hidden">{label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function SidebarSettingsLink() {
  const pathname = usePathname();
  const { close } = useSidebar();
  const settingsItem: NavItem = { label: 'Settings', icon: Settings, href: '/settings' };
  const isActive = isRouteActive(pathname, settingsItem);

  return (
    <Link 
      href="/settings" 
      onClick={() => {
        if (window.innerWidth < 1024) close();
      }}
      className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
    >
        <Settings className="size-5 shrink-0" /><span className="lg:group-[.is-collapsed]:hidden">Settings</span>
    </Link>
  );
}
