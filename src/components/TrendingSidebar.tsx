'use client';

import Link from 'next/link';
import { Zap, UserRound, Loader2, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UserAvatar } from '@/components/UserAvatar';
import FollowButton from '@/components/FollowButton';
import { FollowTagButton } from '@/components/FollowTagButton';

type TrendingTag = {
  tag: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  };
  recentCount: number;
};

type SpotlightCreator = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  bio: string | null;
  _count: {
    followers: number;
    posts: number;
  };
};

export function TrendingSidebar() {
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [featuredCreator, setFeaturedCreator] = useState<SpotlightCreator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingRes, creatorsRes] = await Promise.all([
          fetch('/api/feed/trending?limit=5'),
          fetch('/api/social/suggested')
        ]);
        
        if (trendingRes.ok) {
          const trendingData = await trendingRes.json();
          setTrending(trendingData.trending || []);
        }
        
        if (creatorsRes.ok) {
          const creatorsData = await creatorsRes.json();
          if (creatorsData.creators && creatorsData.creators.length > 0) {
            setFeaturedCreator(creatorsData.creators[0]);
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    const handleRefresh = () => {
      fetchData();
    };

    window.addEventListener('refreshTrending', handleRefresh);
    return () => window.removeEventListener('refreshTrending', handleRefresh);
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
              <div className="mt-5 flex flex-col gap-4">
                  {trending.map((item, index) => (
                      <div key={item.tag.id} className="flex items-center justify-between gap-3 group">
                          <Link href={`/explore?tag=${item.tag.slug}`} className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="font-mono text-xs text-primary">{(index + 1).toString().padStart(2, '0')}</span>
                              <div className="min-w-0">
                                  <span className="block text-sm font-medium transition group-hover:text-primary truncate">#{item.tag.name}</span>
                                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{item.recentCount} posts</span>
                              </div>
                          </Link>
                          <FollowTagButton tagId={item.tag.id} tagName={item.tag.name} variant="compact" />
                      </div>
                  ))}
              </div>
            )}
        </section>

        <section className="rounded-xl border bg-card/30 overflow-hidden relative">
            <div className="p-5">
                <div className="flex items-center justify-between">
                  <p className="eyebrow flex items-center gap-1.5">
                    <Sparkles className="size-3 text-primary animate-pulse" />
                    Creator spotlight
                  </p>
                </div>

                {featuredCreator ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/profile/${featuredCreator.username}`} className="flex items-center gap-3 group min-w-0 flex-1">
                        <UserAvatar src={featuredCreator.image} name={featuredCreator.name} className="size-10 shrink-0 group-hover:opacity-80 transition-opacity" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {featuredCreator.name}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">
                            @{featuredCreator.username}
                          </p>
                        </div>
                      </Link>
                      <div className="shrink-0">
                        <FollowButton userId={featuredCreator.id} />
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {featuredCreator.bio || "Meet the creators shaping the next layer of digital culture."}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/50">
                      <span>{featuredCreator._count.followers} followers</span>
                      <span>{featuredCreator._count.posts} vibes</span>
                    </div>

                    <Link href="/explore" className="button-outline mt-2 w-full justify-center inline-flex items-center text-xs">
                      Explore all creators <UserRound className="size-3.5 ml-2" />
                    </Link>
                  </div>
                ) : (
                  <>
                    <h2 className="mt-2 font-display text-lg font-semibold">Make the unseen visible.</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Meet the people shaping the next layer of culture.</p>
                    <Link href="/explore" className="button-outline mt-5 inline-flex text-xs">
                      Explore creators <UserRound className="size-4 ml-2" />
                    </Link>
                  </>
                )}
            </div>
        </section>
    </div>
  )
}
