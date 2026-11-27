import { Home, Bell, User, Settings, Search, Mail, Bookmark, Users, LucideIcon } from 'lucide-react';
import { NavItem } from './route-matcher';
import { t } from '@/lib/copy';

export interface SidebarNavItem extends NavItem {
  icon: LucideIcon;
}

export interface SidebarNavConfigOptions {
  profileHref: string;
}

export function createSidebarNavigation(options: SidebarNavConfigOptions): SidebarNavItem[] {
  return [
    { label: t('nav.home', 'Home'), icon: Home, href: '/', match: { type: 'exact' } },
    { label: t('nav.explore', 'Explore'), icon: Search, href: '/explore' },
    { label: t('nav.notifications', 'Notifications'), icon: Bell, href: '/notifications' },
    { label: t('nav.profile', 'Profile'), icon: User, href: options.profileHref, match: { type: 'segment-prefix', base: '/profile' } },
    { label: t('nav.messages', 'Messages'), icon: Mail, href: '/messages' },
    { label: t('nav.bookmarks', 'Bookmarks'), icon: Bookmark, href: '/bookmarks' },
    { label: t('nav.communities', 'Communities'), icon: Users, href: '/communities' },
  ];
}

export const sidebarSettingsItem: SidebarNavItem = {
  label: t('nav.settings', 'Settings'),
  icon: Settings,
  href: '/settings',
};
