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
      {/* Mobile Sticky Tabs Bar (Unified Clean Underline Style) */}
      <div className="xl:hidden w-full sticky top-[118px] lg:top-16 z-30 py-1 bg-background/95 backdrop-blur-2xl mb-3">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'feed' | 'discovery')} className="w-full">
          <TabsList className="w-full flex items-center border-b border-border/60 bg-transparent p-0 rounded-none h-auto gap-4 sm:gap-6">
            <TabsTrigger
              value="feed"
              className="flex items-center gap-1.5 sm:gap-2 py-3 px-1 text-xs sm:text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
            >
              <Newspaper className="size-3.5 sm:size-4 shrink-0" />
              <span>Feed</span>
            </TabsTrigger>
            <TabsTrigger
              value="discovery"
              className="flex items-center gap-1.5 sm:gap-2 py-3 px-1 text-xs sm:text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
            >
              <Compass className="size-3.5 sm:size-4 shrink-0" />
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
