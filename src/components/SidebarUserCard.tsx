"use client";

import Link from 'next/link';
import { useSidebar } from './SidebarContext';
import { UserAvatar } from './UserAvatar';
import { CustomSignOutButton } from './CustomSignOutButton';

interface SidebarUserCardProps {
  profileHref: string;
  userImage?: string | null;
  userName?: string | null;
  userUsername?: string | null;
  userEmail?: string | null;
}

export function SidebarUserCard({
  profileHref,
  userImage,
  userName,
  userUsername,
  userEmail,
}: SidebarUserCardProps) {
  const { close } = useSidebar();

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      close();
    }
  };

  return (
    <div className="mt-4 relative group">
      <div className="flex flex-col gap-4 bg-primary/10 border border-primary/50 text-primary transition-colors p-3 lg:group-[.is-collapsed]:p-0 lg:group-[.is-collapsed]:bg-transparent lg:group-[.is-collapsed]:border-transparent lg:group-[.is-collapsed]:items-center rounded-2xl lg:group-[.is-collapsed]:rounded-full cursor-pointer">
        <div className="flex items-center gap-3">
          <Link
            href={profileHref}
            onClick={handleLinkClick}
            className="hover:opacity-80 transition-opacity"
          >
            <UserAvatar src={userImage} name={userName || undefined} className="shrink-0 transition-all" />
          </Link>
          <div className="min-w-0 flex-1 lg:group-[.is-collapsed]:hidden flex items-center justify-between">
            <Link
              href={profileHref}
              onClick={handleLinkClick}
              className="hover:opacity-80 transition-opacity min-w-0 flex-1 pr-2"
            >
              <p className="truncate text-sm font-medium">{userName || userEmail?.split('@')[0]}</p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">@{userUsername || userEmail}</p>
            </Link>
            <div className="shrink-0">
              <CustomSignOutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
