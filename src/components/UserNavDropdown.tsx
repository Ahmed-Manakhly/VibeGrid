'use client';

import { useSession } from '@/components/auth/SessionProvider';
import { UserAvatar } from '@/components/UserAvatar';
import { LogOut, User, Settings, Bookmark, Bell, MessageSquare, Compass, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

import { useRealtime } from '@/shared/infrastructure/socket/RealtimeProvider';

export function UserNavDropdown() {
  const { user, logout } = useSession();
  const { unreadCount, unreadMessagesCount } = useRealtime();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const displayName = user.name || user.email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hidden lg:flex items-center justify-center rounded-full outline-none"
        aria-label="User menu"
      >
        <UserAvatar src={user.image} name={displayName} className="size-9" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-card border border-border/80 shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-2.5 border-b border-border/50 mb-1">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate font-mono">{user.email}</p>
          </div>

          <div className="flex flex-col gap-0.5">
            <Link
              href={user.username ? `/profile/${user.username}` : '/login'}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <User className="size-4" /> Profile
            </Link>
            <Link
              href="/explore"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Compass className="size-4" /> Explore
            </Link>
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Bell className="size-4" /> Notifications
              </div>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="size-4" /> Messages
              </div>
              {unreadMessagesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
            </Link>
            <Link
              href="/communities"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Users className="size-4" /> Communities
            </Link>
            <Link
              href="/bookmarks"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Bookmark className="size-4" /> Bookmarks
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Settings className="size-4" /> Settings
            </Link>
          </div>

          <div className="pt-1.5 mt-1 border-t border-border/50">
            <button
              onClick={() => {
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
