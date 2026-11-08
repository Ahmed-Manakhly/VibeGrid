import Link from 'next/link';

export function VibeLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 scale-110 origin-left group/logo" aria-label="VibeGrid home">
      <span className="grid-mark shrink-0 group-hover/logo:scale-105 transition-transform" aria-hidden="true">
        <span className="bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
        <span className="bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
        <span className="bg-accent shadow-[0_0_8px_hsl(var(--accent))]" />
        <span className="bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
      </span>
      <span className="font-display text-xl font-bold tracking-tight group-[.is-collapsed]:hidden">
        <span className="text-accent drop-shadow-[0_0_12px_hsl(var(--accent)/0.4)]">vibe</span>
        <span className="text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.4)]">grid</span>
      </span>
    </Link>
  );
}
