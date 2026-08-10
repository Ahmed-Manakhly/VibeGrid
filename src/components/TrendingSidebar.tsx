import Link from 'next/link';
import { Zap, UserRound } from 'lucide-react';

export function TrendingSidebar() {
  return (
    <div className="flex flex-col gap-6">
        <section className="surface-panel p-5">
            <div className="flex items-center justify-between">
                <p className="eyebrow">Trending now</p>
                <Zap className="size-4 text-primary" />
            </div>
            <div className="mt-5 flex flex-col gap-5">
                {[
                    ['01', 'Generative craft', '12.4K posts'], 
                    ['02', 'Soft futurism', '8.7K posts'], 
                    ['03', 'The slow web', '5.1K posts']
                ].map(([num, title, count]) => (
                    <Link href="#" key={title} className="group flex gap-4">
                        <span className="font-mono text-xs text-primary">{num}</span>
                        <span>
                            <span className="block text-sm font-medium transition group-hover:text-primary">{title}</span>
                            <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{count}</span>
                        </span>
                    </Link>
                ))}
            </div>
        </section>

        <section className="feed-card overflow-hidden">
            <div className="p-5">
                <p className="eyebrow">Creator spotlight</p>
                <h2 className="mt-2 font-display text-xl font-semibold">Make the unseen visible.</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Meet the people shaping the next layer of culture.</p>
                <Link href="#" className="button-outline mt-5 inline-flex">Explore creators <UserRound className="size-4 ml-2" /></Link>
            </div>
        </section>
    </div>
  )
}
