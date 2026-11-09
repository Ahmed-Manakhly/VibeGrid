'use client';

import { useState } from 'react';
import { Newspaper, Compass } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MobileTabsLayout({ 
  feed, 
  discovery 
}: { 
  feed: React.ReactNode; 
  discovery: React.ReactNode; 
}) {
  const [activeTab, setActiveTab] = useState<'feed' | 'discovery'>('feed');

  return (
    <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 xl:items-start w-full">
      {/* Mobile Sticky Tabs Bar (Unified with Profile & Settings style) */}
      <div className="xl:hidden w-full sticky top-[118px] lg:top-16 z-30 -mx-4 px-4 sm:mx-0 sm:px-0 py-2.5 bg-background/95 backdrop-blur-2xl border-b border-border/70 shadow-sm transition-all mb-4">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'feed' | 'discovery')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/60 dark:bg-muted/40 rounded-xl sm:max-w-md">
            <TabsTrigger
              value="feed"
              className="flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Newspaper className="size-4 shrink-0" />
              <span>Feed</span>
            </TabsTrigger>
            <TabsTrigger
              value="discovery"
              className="flex items-center justify-center gap-2 py-2 rounded-lg font-semibold text-xs sm:text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Compass className="size-4 shrink-0" />
              <span>Discovery</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Feed Column */}
      <div className={`w-full xl:w-auto xl:flex-1 min-w-0 ${activeTab === 'feed' ? 'block' : 'hidden xl:block'}`}>
        {feed}
      </div>
      
      {/* Discovery Column (Right Sidebar) */}
      <div className={`w-full xl:w-[320px] shrink-0 xl:self-stretch ${activeTab === 'discovery' ? 'block' : 'hidden xl:block'}`}>
        <div className="flex flex-col gap-6 xl:sticky xl:top-24 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto z-10 pb-10 px-4 -mx-4 scrollbar-hide">
          {discovery}
        </div>
      </div>
    </div>
  );
}
