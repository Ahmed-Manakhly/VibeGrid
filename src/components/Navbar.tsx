import Link from 'next/link'
import { Search, Bell, Plus } from 'lucide-react'
import { ModeToggle } from './ModeToggle'
import { VibeLogo } from './VibeLogo'
import { currentUser } from '@clerk/nextjs/server'
import { syncUser } from '@/actions/user.action'
import { MobileMenuButton } from './MobileMenuButton'
import { UserButton } from '@clerk/nextjs'
import { DesktopDropVibeButton } from './DropVibeButtons'
import { NavSearch, MobileNavSearch } from './NavSearch'

async function Navbar() {
  const user = await currentUser();
  if (user) await syncUser();

  return (
    <header className="sticky top-0 z-50 flex flex-col w-full">
      <div className="nav-glass flex h-16 items-center gap-4 px-5 lg:px-9">
        <MobileMenuButton />
        <div className="lg:hidden"><VibeLogo /></div>
        
        <NavSearch />
        
        <div className="ml-auto flex items-center gap-3">
          <ModeToggle />
          {user ? (
              <>
                  <button className="icon-button hidden sm:flex" aria-label="Notifications"><Bell className="size-4" /></button>
                  <DesktopDropVibeButton />
                  <div className="pl-2 border-l border-border/50 ml-2 hidden sm:block">
                    <UserButton />
                  </div>
              </>
          ) : (
              <>
                  <Link href="/register" className="btn-secondary hidden items-center justify-center px-4 py-2 text-sm sm:flex">Sign up</Link>
                  <Link href="/login" className="btn-gradient hidden items-center gap-2 px-4 py-2 text-sm sm:flex">Log in</Link>
              </>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      <MobileNavSearch />
    </header>
  )
}

export default Navbar