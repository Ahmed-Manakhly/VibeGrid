import Link from 'next/link';

export function VibeLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 scale-110 origin-left" aria-label="VibeGrid home">
      <span className="grid-mark shrink-0" aria-hidden="true"><span /><span /><span /><span /></span>
      <span className="font-display text-xl font-semibold tracking-tight group-[.is-collapsed]:hidden"><span className="text-[#d8b65c] transition-colors duration-300">vibe</span><span className="text-primary transition-colors duration-300">grid</span></span>
    </Link>
  )
}
