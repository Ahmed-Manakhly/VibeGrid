'use client';
import { useSidebar } from './SidebarContext';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, close, toggle } = useSidebar();

  return (
    <>
      {/* Mobile Overlay Background */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col border-r-0 surface-panel transition-all duration-300 ease-in-out group
          ${isOpen ? 'w-[280px] translate-x-0 opacity-100 p-6 is-open' : 'w-[280px] -translate-x-full lg:translate-x-0 lg:w-[88px] lg:opacity-100 lg:px-4 lg:py-6 is-collapsed'}
        `}
      >
        <button 
          className="hidden lg:flex absolute top-8 -right-3.5 z-50 bg-card border border-border shadow-sm rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-accent hover:border-accent transition-all" 
          onClick={toggle}
        >
          {isOpen ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
        </button>

        <div className={`h-full flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'w-[232px]' : 'w-full items-center'}`}>
          <button className="lg:hidden absolute top-4 right-4 text-muted-foreground p-2 hover:bg-white/10 rounded-full" onClick={close}>
            <X className="size-5" />
          </button>
          {children}
        </div>
      </aside>
    </>
  );
}
