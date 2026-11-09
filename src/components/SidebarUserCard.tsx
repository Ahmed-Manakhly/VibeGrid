"use client";

import Link from 'next/link';
import { useSidebar } from './SidebarContext';
import { UserAvatar } from './UserAvatar';
import { CustomSignOutButton } from './CustomSignOutButton';
import { useSession } from './auth/SessionProvider';

interface SidebarUserCardProps {
  initialProfileHref?: string;
  initialUserImage?: string | null;
  initialUserName?: string | null;
  initialUserUsername?: string | null;
  initialUserEmail?: string | null;
  initialAuthUser?: any;
}

export function SidebarUserCard({
  initialProfileHref,
  initialUserImage,
  initialUserName,
  initialUserUsername,
  initialUserEmail,
  initialAuthUser,
}: SidebarUserCardProps) {
  const { close } = useSidebar();
  const { user: clientUser, isAuthenticated } = useSession();

  // Combine server initial props with live client session state
  const activeUser = clientUser || initialAuthUser;
  const isUserAuthenticated = isAuthenticated || Boolean(initialAuthUser);

  if (!isUserAuthenticated || !activeUser) {
    return null;
  }

  const userImage = clientUser?.image ?? initialUserImage ?? null;
  const userName = clientUser?.name || initialUserName || activeUser.name;
  const userUsername = clientUser?.username || initialUserUsername;
  const userEmail = clientUser?.email || initialUserEmail || activeUser.email;

  const displayHandle = userUsername || (userEmail ? userEmail.split('@')[0] : 'user');
  const targetHref = initialProfileHref || `/profile/${displayHandle}`;

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      close();
    }
  };

  return (
    <div className="mt-4 relative group">
      <div className="flex flex-col gap-4 backdrop-blur-2xl bg-primary/10 border border-primary/50 text-foreground transition-all duration-300 p-3 lg:group-[.is-collapsed]:p-0 lg:group-[.is-collapsed]:bg-transparent lg:group-[.is-collapsed]:border-transparent lg:group-[.is-collapsed]:items-center rounded-2xl lg:group-[.is-collapsed]:rounded-full cursor-pointer shadow-[0_4px_20px_rgba(4,120,87,0.12)] hover:shadow-[0_8px_30px_rgba(4,120,87,0.22)] hover:border-primary">
        <div className="flex items-center gap-3">
          <Link
            href={targetHref}
            onClick={handleLinkClick}
            className="hover:opacity-80 transition-opacity"
          >
            <UserAvatar src={userImage} name={userName || undefined} className="shrink-0 transition-all" />
          </Link>
          <div className="min-w-0 flex-1 lg:group-[.is-collapsed]:hidden flex items-center justify-between">
            <Link
              href={targetHref}
              onClick={handleLinkClick}
              className="hover:opacity-80 transition-opacity min-w-0 flex-1 pr-2"
            >
              <p className="truncate text-sm font-medium">{userName || (userEmail ? userEmail.split('@')[0] : 'User')}</p>
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
