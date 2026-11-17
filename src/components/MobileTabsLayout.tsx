'use client';

import { useState, useEffect } from 'react';
import { Newspaper, Compass } from 'lucide-react';
import { UnifiedTabsBar } from '@/components/UnifiedTabsBar';
import { usePathname, useSearchParams } from 'next/navigation';

const MOBILE_FEED_TABS = [
  { value: 'feed', label: 'Feed', icon: Newspaper },
  { value: 'discovery', label: 'Discovery', icon: Compass },
];

export function MobileTabsLayout({ 
  feed, 
  discovery 
}: { 
  feed: React.ReactNode; 
  discovery: React.ReactNode; 
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewParam = searchParams.get('view');
  
  const [activeTab, setActiveTab] = useState<'feed' | 'discovery'>(() => 
    viewParam === 'discovery' ? 'discovery' : 'feed'
  );

  // Synchronize when URL path or searchParams change (e.g. clicking category, tag, search, or view param)
  useEffect(() => {
    if (viewParam === 'discovery') {
      setActiveTab('discovery');
    } else {
      // Whenever query params change (e.g. ?category=database, ?tag=react, ?q=...) or path changes,
      // default back to the Feed tab so the user sees the filtered results immediately!
      setActiveTab('feed');
    }
  }, [pathname, searchParams]);

  return (
    <div className="flex flex-col xl:flex-row gap-8 xl:gap-12 xl:items-start w-full">
      {/* Mobile Sticky Tabs Bar (Unified Clean Underline Style) */}
      <UnifiedTabsBar
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'feed' | 'discovery')}
        tabs={MOBILE_FEED_TABS}
        className="xl:hidden mb-3"
      />
      
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
