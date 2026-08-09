'use client';
import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';

export function MobileMenuButton() {
  const { toggle } = useSidebar();
  
  return (
    <button className="icon-button lg:hidden" aria-label="Open menu" onClick={toggle}>
      <Menu className="size-4" />
    </button>
  );
}
