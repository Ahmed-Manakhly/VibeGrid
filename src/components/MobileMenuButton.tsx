'use client';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSidebar } from './SidebarContext';

export function MobileMenuButton() {
  const { toggle, isOpen } = useSidebar();
  
  return (
    <div className="flex items-center gap-4">
      {/* Desktop Toggle */}
      <button className="hidden lg:flex icon-button" aria-label="Toggle menu" onClick={toggle}>
        {isOpen ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
      </button>

      {/* Mobile Toggle */}
      <button className="lg:hidden icon-button" aria-label="Open menu" onClick={toggle}>
        <Menu className="size-5" />
      </button>
    </div>
  );
}
