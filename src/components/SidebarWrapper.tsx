'use client';
import { useSidebar } from './SidebarContext';
import { X } from 'lucide-react';

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useSidebar();

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
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col border-r-0 surface-panel transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'w-[280px] translate-x-0 opacity-100 p-6' : 'w-[280px] -translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:p-0'}
        `}
      >
        <div className="w-[232px] h-full flex flex-col">
          <button className="lg:hidden absolute top-4 right-4 text-muted-foreground p-2 hover:bg-white/10 rounded-full" onClick={close}>
            <X className="size-5" />
          </button>
          {children}
        </div>
      </aside>
    </>
  );
}
