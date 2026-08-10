import Link from 'next/link'
import { Search, Bell, Plus } from 'lucide-react'
import { ModeToggle } from './ModeToggle'
import { VibeLogo } from './VibeLogo'
import { currentUser } from '@clerk/nextjs/server'
import { syncUser } from '@/actions/user.action'
import { MobileMenuButton } from './MobileMenuButton'
import { UserButton } from '@clerk/nextjs'

async function Navbar() {
  const user = await currentUser();
  if (user) await syncUser();

  return (
    <header className="sticky top-0 z-50 flex flex-col w-full">
      <div className="nav-glass flex h-20 items-center gap-4 px-5 lg:px-9">
        <MobileMenuButton />
        <div className="lg:hidden"><VibeLogo /></div>
        
        <div className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className="h-10 w-full rounded-xl border border-border/70 bg-card/60 pl-10 pr-4 text-sm outline-none transition focus:border-border focus:ring-1 focus:ring-border" placeholder="Search the grid..." aria-label="Search the grid" />
        </div>
        
        <div className="ml-auto flex items-center gap-3">
          <ModeToggle />
          {user ? (
              <>
                  <button className="icon-button hidden sm:flex" aria-label="Notifications"><Bell className="size-4" /></button>
                  <Link href="/" className="btn-gradient hidden items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold sm:flex"><Plus className="size-4" /> Drop Vibe</Link>
                  <div className="pl-2 border-l border-border/50 ml-2 hidden sm:block">
                    <UserButton />
                  </div>
              </>
          ) : (
              <>
                  <Link href="/login" className="btn-secondary hidden items-center justify-center px-4 py-2 text-sm sm:flex">Log in</Link>
                  <Link href="/register" className="btn-gradient hidden items-center gap-2 px-4 py-2 text-sm sm:flex"><Plus className="size-4" /> Sign up</Link>
              </>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="nav-glass sm:hidden px-5 pb-3 pt-1 border-t-0 shadow-none rounded-none !bg-background/95">
         <div className="relative w-full">
           <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
           <input className="h-10 w-full rounded-xl border border-border/70 bg-card/80 pl-10 pr-4 text-sm outline-none transition focus:border-border focus:ring-1 focus:ring-border" placeholder="Search the grid..." aria-label="Search the grid" />
         </div>
      </div>
    </header>
  )
}

export default Navbar