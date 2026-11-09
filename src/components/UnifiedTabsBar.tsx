'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface TabItem {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface UnifiedTabsBarProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: TabItem[];
  sticky?: boolean;
  className?: string;
  tabsListClassName?: string;
}

export function UnifiedTabsBar({
  value,
  onValueChange,
  tabs,
  sticky = true,
  className,
  tabsListClassName,
}: UnifiedTabsBarProps) {
  return (
    <div
      className={cn(
        'w-full py-1 bg-transparent backdrop-blur-md mb-4',
        sticky && 'sticky top-[118px] lg:top-16 z-30',
        className
      )}
    >
      <Tabs value={value} onValueChange={onValueChange} className="w-full">
        <TabsList
          className={cn(
            'w-full flex items-center justify-start flex-wrap border-b border-border/50 bg-transparent p-0 rounded-none h-auto gap-x-4 sm:gap-x-6 gap-y-1',
            tabsListClassName
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-1.5 sm:gap-2 py-2.5 px-1 text-sm font-semibold text-muted-foreground border-b-2 border-transparent rounded-none bg-transparent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all shrink-0"
              >
                {Icon && <Icon className="size-4 shrink-0" />}
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}
