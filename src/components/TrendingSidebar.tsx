'use client';

import Link from 'next/link';
import { Zap, UserRound, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type TrendingTag = {
  tag: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  };
  recentCount: number;
};

export function TrendingSidebar() {
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('/api/feed/trending?limit=5');
        if (!res.ok) throw new Error('Failed to fetch trending topics');
        const data = await res.json();
        setTrending(data.trending || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTrending();
  }, []);

  return (
    <div className="flex flex-col gap-6">
        <section className="rounded-xl border bg-card/30 p-5">
            <div className="flex items-center justify-between">
                <p className="eyebrow">Trending now</p>
                <Zap className="size-4 text-primary" />
            </div>
            
            {isLoading ? (
              <div className="mt-5 flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="mt-5 text-sm text-red-500">
                Failed to load trending topics.
              </div>
            ) : trending.length === 0 ? (
              <div className="mt-5 text-sm text-muted-foreground">
                No trending topics yet.
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-5">
                  {trending.map((item, index) => (
                      <Link href={`/explore?tag=${item.tag.slug}`} key={item.tag.id} className="group flex gap-4">
                          <span className="font-mono text-xs text-primary">{(index + 1).toString().padStart(2, '0')}</span>
                          <span>
                              <span className="block text-sm font-medium transition group-hover:text-primary">#{item.tag.name}</span>
                              <span className="mt-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{item.recentCount} posts</span>
                          </span>
                      </Link>
                  ))}
              </div>
            )}
        </section>

        <section className="rounded-xl border bg-card/30 overflow-hidden">
            <div className="p-5">
                <p className="eyebrow">Creator spotlight</p>
                <h2 className="mt-2 font-display text-lg font-semibold">Make the unseen visible.</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Meet the people shaping the next layer of culture.</p>
                <Link href="#" className="button-outline mt-5 inline-flex">Explore creators <UserRound className="size-4 ml-2" /></Link>
            </div>
        </section>
    </div>
  )
}
