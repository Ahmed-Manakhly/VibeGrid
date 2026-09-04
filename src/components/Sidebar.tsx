import { getCurrentSession } from '@/lib/auth/server';
import { prisma } from '@/shared/infrastructure/prisma';
import Link from 'next/link';
import { VibeLogo } from './VibeLogo';
import { CustomSignOutButton } from './CustomSignOutButton';
import { UserAvatar } from './UserAvatar';
import { SidebarNav, SidebarSettingsLink } from './SidebarNav';

import { SidebarUserCard } from './SidebarUserCard';

export async function Sidebar() {
  const session = await getCurrentSession();
  const authUser = session.user;

  let dbUser = null;
  if (authUser?.id) {
    dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { username: true, name: true, email: true, image: true },
    });
  }

  const profileUsername = dbUser?.username || authUser?.name || authUser?.email.split('@')[0];
  const profileHref = authUser ? `/profile/${profileUsername}` : '/login';

  return (
    <>
      <div className="mb-8 pl-2 scale-110 origin-left lg:group-[.is-collapsed]:mt-4 lg:group-[.is-collapsed]:w-full lg:group-[.is-collapsed]:flex lg:group-[.is-collapsed]:justify-center lg:group-[.is-collapsed]:pl-0 lg:group-[.is-collapsed]:ml-0 lg:group-[.is-collapsed]:origin-center">
        <VibeLogo />
      </div>

      <SidebarNav profileHref={profileHref} />
      
      <div className="mt-auto flex flex-col gap-2">
        <SidebarSettingsLink />
        
        {authUser && (
          <SidebarUserCard
            profileHref={profileHref}
            userImage={dbUser?.image}
            userName={dbUser?.name || authUser.name}
            userUsername={dbUser?.username}
            userEmail={authUser.email}
          />
        )}
      </div>
    </>
  );
}

