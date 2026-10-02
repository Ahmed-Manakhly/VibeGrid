"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { isRouteActive } from './route-matcher';
import { createSidebarNavigation, sidebarSettingsItem } from './sidebar-navigation.config';

interface SidebarNavProps {
  profileHref: string;
}

export function SidebarNav({ profileHref }: SidebarNavProps) {
  const pathname = usePathname();
  const { close } = useSidebar();

  const items = createSidebarNavigation({ profileHref });

  return (
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
            <Icon className="size-5 shrink-0" />
            <span className="lg:group-[.is-collapsed]:hidden">{label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function SidebarSettingsLink() {
  const pathname = usePathname();
  const { close } = useSidebar();

  const { label, icon: SettingsIcon, href } = sidebarSettingsItem;
  const isActive = isRouteActive(pathname, sidebarSettingsItem);

  return (
    <Link 
      href={href} 
      onClick={() => {
        if (window.innerWidth < 1024) close();
      }}
      className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
    >
      <SettingsIcon className="size-5 shrink-0" />
      <span className="lg:group-[.is-collapsed]:hidden">{label}</span>
    </Link>
  );
}
