import { getCurrentSession } from '@/lib/auth/server';
import { getProfileUseCase } from '@/shared/infrastructure/di-container';
import Link from 'next/link';
import { VibeLogo } from './VibeLogo';
import { CustomSignOutButton } from './CustomSignOutButton';
import { UserAvatar } from './UserAvatar';
import { SidebarNav, SidebarSettingsLink } from './SidebarNav';

import { SidebarUserCard } from './SidebarUserCard';

export async function Sidebar() {
  const session = await getCurrentSession();
  const authUser = session.user;

  let dbUser: any = null;
  if (authUser?.id) {
    dbUser = await getProfileUseCase.execute(authUser.id).catch(() => null);
  }

  const profileUsername = dbUser?.username || (authUser?.username && !authUser.username.includes('@') ? authUser.username : null) || (authUser?.email ? `user_${authUser.email.split('@')[0]}` : null);
  const profileHref = authUser && profileUsername ? `/profile/${profileUsername}` : '/login';

  return (
    <>
      <div className="mb-8 pl-2 scale-110 origin-left lg:group-[.is-collapsed]:mt-4 lg:group-[.is-collapsed]:w-full lg:group-[.is-collapsed]:flex lg:group-[.is-collapsed]:justify-center lg:group-[.is-collapsed]:pl-0 lg:group-[.is-collapsed]:ml-0 lg:group-[.is-collapsed]:origin-center">
        <VibeLogo />
      </div>

      <SidebarNav profileHref={profileHref} />
      
      <div className="mt-auto flex flex-col gap-2">
        <SidebarSettingsLink />
        
        <SidebarUserCard
          initialProfileHref={profileHref}
          initialUserImage={dbUser?.image}
          initialUserName={dbUser?.name || authUser?.name}
          initialUserUsername={dbUser?.username}
          initialUserEmail={authUser?.email}
          initialAuthUser={authUser}
        />
      </div>
    </>
  );
}

