"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import { isRouteActive } from './route-matcher';
import { createSidebarNavigation, sidebarSettingsItem } from './sidebar-navigation.config';
import { useRealtime } from '@/shared/infrastructure/socket/RealtimeProvider';

interface SidebarNavProps {
  profileHref: string;
}

export function SidebarNav({ profileHref }: SidebarNavProps) {
  const pathname = usePathname();
  const { close } = useSidebar();
  const { unreadCount, unreadMessagesCount } = useRealtime();

  const items = createSidebarNavigation({ profileHref });

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => {
        const { label, icon: Icon, href } = item;
        const isActive = isRouteActive(pathname, item);

        const badgeCount =
          label === 'Notifications' ? unreadCount : label === 'Messages' ? unreadMessagesCount : 0;

        return (
          <Link 
            key={label} 
            href={href} 
            onClick={() => {
              if (window.innerWidth < 1024) close();
            }}
            className={`nav-item relative ${isActive ? 'nav-item-active' : ''}`}
          >
            <div className="relative shrink-0">
              <Icon className="size-5" />
              {badgeCount > 0 && (
                <span className="lg:group-[.is-collapsed]:flex absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-in zoom-in-75">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </div>
            <span className="lg:group-[.is-collapsed]:hidden flex-1 flex items-center justify-between">
              <span>{label}</span>
              {badgeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </span>
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
