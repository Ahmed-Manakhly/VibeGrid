import { Home, Bell, User, Settings, Search, Mail, Bookmark, Users, LucideIcon } from 'lucide-react';
import { NavItem } from './route-matcher';

export interface SidebarNavItem extends NavItem {
  icon: LucideIcon;
}

export interface SidebarNavConfigOptions {
  profileHref: string;
}

export function createSidebarNavigation(options: SidebarNavConfigOptions): SidebarNavItem[] {
  return [
    { label: 'Home', icon: Home, href: '/', match: { type: 'exact' } },
    { label: 'Explore', icon: Search, href: '/explore' },
    { label: 'Notifications', icon: Bell, href: '/notifications' },
    { label: 'Profile', icon: User, href: options.profileHref, match: { type: 'segment-prefix', base: '/profile' } },
    { label: 'Messages', icon: Mail, href: '/messages' },
    { label: 'Bookmarks', icon: Bookmark, href: '/bookmarks' },
    { label: 'Communities', icon: Users, href: '/communities' },
  ];
}

export const sidebarSettingsItem: SidebarNavItem = {
  label: 'Settings',
  icon: Settings,
  href: '/settings',
};
