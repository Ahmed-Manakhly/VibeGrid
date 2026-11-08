"use client"

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ArrowUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show if scrolled down past the composer / 350px
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        "fixed bottom-[90px] sm:bottom-8 right-4 sm:right-8 z-50 rounded-full shadow-lg transition-all duration-300 transform",
        "bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-110 active:scale-95",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      )}
      aria-label="Scroll to top"
    >
      <ArrowUpIcon className="size-5" />
    </Button>
  );
}
