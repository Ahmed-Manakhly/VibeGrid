'use client';
import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { VibeLogo } from './VibeLogo';

export function MobileMenuButton() {
  const { toggle, isOpen } = useSidebar();
  
  return (
    <div className="flex items-center gap-4">
      <button className="icon-button" aria-label="Open menu" onClick={toggle}>
        <Menu className="size-4" />
      </button>
      <div className={`hidden lg:block transition-all duration-300 ${isOpen ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
        <VibeLogo />
      </div>
    </div>
  );
}
