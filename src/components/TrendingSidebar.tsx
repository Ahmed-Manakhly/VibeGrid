'use client';

import Link from 'next/link';
import { Zap, Users, Loader2, Sparkles, ArrowRight, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FollowTagButton } from '@/components/FollowTagButton';
import { t } from '@/lib/copy';

type TrendingTag = {
  tag: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  };
  recentCount: number;
};

type SuggestedCommunity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  techTags: string[];
  matchedTag?: string | null;
  isMember?: boolean;
  _count: {
    members: number;
    posts: number;
  };
};

export function TrendingSidebar() {
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [suggestedGuild, setSuggestedGuild] = useState<SuggestedCommunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingRes, guildRes] = await Promise.all([
          fetch('/api/feed/trending?limit=5'),
          fetch('/api/communities/suggested')
        ]);
        
        if (trendingRes.ok) {
          const trendingData = await trendingRes.json();
          setTrending(trendingData.trending || []);
        }
        
        if (guildRes.ok) {
          const guildData = await guildRes.json();
          if (guildData.community) {
            setSuggestedGuild(guildData.community);
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
    window.addEventListener('interests_updated', handleRefresh);
    return () => {
      window.removeEventListener('refreshTrending', handleRefresh);
      window.removeEventListener('interests_updated', handleRefresh);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
        <section className="rounded-xl border bg-card/30 p-5">
            <div className="flex items-center justify-between">
                <p className="eyebrow">{t("trending.eyebrow", "Trending now")}</p>
                <Zap className="size-4 text-primary" />
            </div>
            
            {isLoading ? (
              <div className="mt-5 flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="mt-5 text-sm text-destructive">
                {t("trending.failed", "Failed to load trending topics.")}
              </div>
            ) : trending.length === 0 ? (
              <div className="mt-5 text-sm text-muted-foreground">
                {t("trending.empty", "No trending topics yet.")}
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
                    Suggested Guild
                  </p>
                  {suggestedGuild?.matchedTag && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Matches #{suggestedGuild.matchedTag}
                    </span>
                  )}
                </div>

                {suggestedGuild ? (
                  <div className="mt-4 space-y-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-xl bg-card border-2 border-border/80 flex items-center justify-center shrink-0 overflow-hidden text-primary font-bold shadow-sm">
                        {suggestedGuild.avatarUrl ? (
                          <img src={suggestedGuild.avatarUrl} alt={suggestedGuild.name} className="size-full object-cover" />
                        ) : (
                          <Users className="size-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/communities/${suggestedGuild.slug}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block">
                          {suggestedGuild.name}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate font-mono">
                          /c/{suggestedGuild.slug}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {suggestedGuild.description || "Developer space based on your active tech interests and stack."}
                    </p>

                    {suggestedGuild.techTags && suggestedGuild.techTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {suggestedGuild.techTags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-secondary/50 text-foreground/80">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/50">
                      <span>{suggestedGuild._count?.members || 1} members</span>
                      <span>{suggestedGuild._count?.posts || 0} vibes</span>
                    </div>

                    <Link
                      href={`/communities/${suggestedGuild.slug}`}
                      className="btn-gradient mt-2 w-full justify-center inline-flex items-center text-xs py-2 rounded-xl text-white font-medium shadow-sm hover:opacity-90 transition-opacity"
                    >
                      <span>Explore Guild</span>
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="mt-3">
                    <h3 className="font-display text-sm font-semibold text-foreground">Find Your Guild</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Join specialized engineering spaces aligned with your tech stack.
                    </p>
                    <Link href="/communities" className="button-outline mt-3.5 w-full justify-center inline-flex items-center text-xs">
                      <span>Browse All Guilds</span>
                      <Users className="size-3.5 ml-1.5" />
                    </Link>
                  </div>
                )}
            </div>
        </section>
    </div>
  )
}
