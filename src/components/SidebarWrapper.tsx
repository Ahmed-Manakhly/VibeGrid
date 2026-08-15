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
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[55] lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 h-screen z-[60] lg:z-40 flex flex-col border-r-0 sidebar-glass rounded-none transition-all duration-300 ease-in-out group
          ${isOpen ? 'w-[280px] translate-x-0 opacity-100 p-6 is-open' : 'w-[280px] -translate-x-full p-6 lg:p-0 lg:translate-x-0 lg:w-[88px] lg:opacity-100 lg:px-4 lg:py-6 is-collapsed'}
        `}
      >

        <div className={`h-full flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'w-[232px]' : 'w-full lg:items-center'}`}>
          <button className="lg:hidden absolute top-4 right-4 icon-button z-[100]" aria-label="Close menu" onClick={close}>
            <X className="size-5" />
          </button>
          {children}
        </div>
      </aside>
    </>
  );
}
