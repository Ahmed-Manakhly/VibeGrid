import Link from 'next/link'
import { Search, Bell, Plus, Menu } from 'lucide-react'
import { ModeToggle } from './ModeToggle'
import { VibeLogo } from './VibeLogo'
import { currentUser } from '@clerk/nextjs/server'
import { syncUser } from '@/actions/user.action'

async function Navbar() {
  const user = await currentUser();
  if (user) await syncUser();

  return (
    <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b border-border/60 bg-background/70 px-5 backdrop-blur-2xl lg:px-9">
      <button className="icon-button lg:hidden" aria-label="Open menu"><Menu className="size-4" /></button>
      <div className="lg:hidden"><VibeLogo /></div>
      
      <div className="relative ml-auto w-full max-w-sm hidden sm:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input className="h-10 w-full rounded-xl border border-border/70 bg-card/60 pl-10 pr-4 text-sm outline-none transition focus:border-primary/70 focus:ring-2 focus:ring-primary/10" placeholder="Search the grid..." aria-label="Search the grid" />
      </div>
      
      <div className="ml-auto sm:ml-4 flex items-center gap-3">
        <ModeToggle />
        {user ? (
            <>
                <button className="icon-button" aria-label="Notifications"><Bell className="size-4" /></button>
                <Link href="/" className="button-glow hidden items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold sm:flex"><Plus className="size-4" /> Drop Vibe</Link>
            </>
        ) : (
            <>
                <Link href="/login" className="hidden rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary/60 sm:block">Log in</Link>
                <Link href="/register" className="button-glow hidden items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold sm:flex"><Plus className="size-4" /> Sign up</Link>
            </>
        )}
      </div>
    </header>
  )
}

export default Navbar