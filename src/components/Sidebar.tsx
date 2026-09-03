import { getCurrentSession } from '@/lib/auth/server';
import Link from 'next/link';
import { VibeLogo } from './VibeLogo';
import { CustomSignOutButton } from './CustomSignOutButton';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { SidebarNav, SidebarSettingsLink } from './SidebarNav';

export async function Sidebar() {
  const session = await getCurrentSession();
  const authUser = session.user;
  const profileHref = authUser ? `/profile/${authUser.name || authUser.email.split('@')[0]}` : '/login';

  return (
    <>
      <div className="mb-8 pl-2 scale-110 origin-left lg:group-[.is-collapsed]:mt-4 lg:group-[.is-collapsed]:w-full lg:group-[.is-collapsed]:flex lg:group-[.is-collapsed]:justify-center lg:group-[.is-collapsed]:pl-0 lg:group-[.is-collapsed]:ml-0 lg:group-[.is-collapsed]:origin-center">
        <VibeLogo />
      </div>

      <SidebarNav profileHref={profileHref} />
      
      <div className="mt-auto flex flex-col gap-2">
        <SidebarSettingsLink />
        
        {authUser && (
          <div className="mt-4 relative group">
            <div className="flex flex-col gap-4 bg-primary/10 border border-primary/50 text-primary transition-colors p-3 lg:group-[.is-collapsed]:p-0 lg:group-[.is-collapsed]:bg-transparent lg:group-[.is-collapsed]:border-transparent lg:group-[.is-collapsed]:items-center rounded-2xl lg:group-[.is-collapsed]:rounded-full cursor-pointer">
              <div className="flex items-center gap-3">
                <Link href={profileHref} className="hover:opacity-80 transition-opacity">
                  <Avatar className="shrink-0 transition-all">
                      <AvatarFallback>{authUser.name?.charAt(0) || authUser.email.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1 lg:group-[.is-collapsed]:hidden flex items-center justify-between">
                  <Link href={profileHref} className="hover:opacity-80 transition-opacity min-w-0 flex-1 pr-2">
                    <p className="truncate text-sm font-medium">{authUser.name || authUser.email.split('@')[0]}</p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">{authUser.email}</p>
                  </Link>
                  <div className="shrink-0">
                    <CustomSignOutButton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

