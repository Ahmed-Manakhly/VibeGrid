"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, User, Settings, Search, Mail, Bookmark, Users } from 'lucide-react';

interface SidebarNavProps {
  profileHref: string;
}

export function SidebarNav({ profileHref }: SidebarNavProps) {
  const pathname = usePathname();

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
          const isActive = href === '/' ? pathname === '/' : pathname?.startsWith(href);
          return (
            <Link key={label} href={href} className={`nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <Icon className="size-5 shrink-0" /><span className="group-[.is-collapsed]:hidden">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Link href="/settings" className={`nav-item ${pathname?.startsWith('/settings') ? 'nav-item-active' : ''}`}>
            <Settings className="size-5 shrink-0" /><span className="group-[.is-collapsed]:hidden">Settings</span>
        </Link>
      </div>
    </>
  );
}
