"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, Settings, Search, Mail, Bookmark, Users } from 'lucide-react';
import { useSidebar } from './SidebarContext';

interface SidebarNavProps {
  profileHref: string;
}

export function SidebarNav({ profileHref }: SidebarNavProps) {
  const pathname = usePathname();
  const { close } = useSidebar();

  const items = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Explore', icon: Search, href: '/explore' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Profile', icon: User, href: profileHref },
    { label: 'Messages', icon: Mail, href: '/messages' },
    { label: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
    { label: 'Communities', icon: Users, href: '/communities' },
  ];

  return (
    <>
      <div className="flex flex-col gap-2">
        {items.map(({ label, icon: Icon, href }) => {
          const isActive = href === '/' 
            ? pathname === '/' 
            : Boolean(pathname?.startsWith(href));

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
  const isActive = pathname?.startsWith('/settings');

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
