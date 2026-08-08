import Link from 'next/link';

export function VibeLogo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="VibeGrid home">
      <span className="grid-mark" aria-hidden="true"><span /><span /><span /><span /></span>
      <span className="font-display text-lg font-semibold tracking-tight">vibe<span className="text-primary">grid</span></span>
    </Link>
  )
}
