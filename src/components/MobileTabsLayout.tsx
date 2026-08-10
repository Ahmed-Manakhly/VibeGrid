'use client';

import { useState } from 'react';

export function MobileTabsLayout({ 
  feed, 
  discovery 
}: { 
  feed: React.ReactNode; 
  discovery: React.ReactNode; 
}) {
  const [activeTab, setActiveTab] = useState<'feed' | 'discovery'>('feed');

  return (
    <div className="flex flex-col xl:flex-row gap-10 xl:items-start w-full">
      {/* Mobile Tabs */}
      <div className="xl:hidden flex gap-2 border-b border-border/50 pb-0">
        <button 
          onClick={() => setActiveTab('feed')} 
          className={`flex-1 text-center py-3 text-sm font-semibold transition-all ${
            activeTab === 'feed' 
              ? 'text-primary border-b-2 border-primary shadow-[0_4px_10px_-4px_hsl(var(--primary)/0.5)]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Feed
        </button>
        <button 
          onClick={() => setActiveTab('discovery')} 
          className={`flex-1 text-center py-3 text-sm font-semibold transition-all ${
            activeTab === 'discovery' 
              ? 'text-primary border-b-2 border-primary shadow-[0_4px_10px_-4px_hsl(var(--primary)/0.5)]' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Discovery
        </button>
      </div>
      
      {/* Feed Column */}
      <div className={`w-full xl:w-auto xl:flex-1 min-w-0 ${activeTab === 'feed' ? 'block' : 'hidden xl:block'}`}>
        {feed}
      </div>
      
      {/* Discovery Column (Right Sidebar) */}
      <div className={`w-full xl:w-auto ${activeTab === 'discovery' ? 'block' : 'hidden xl:block'}`}>
        {discovery}
      </div>
    </div>
  );
}
