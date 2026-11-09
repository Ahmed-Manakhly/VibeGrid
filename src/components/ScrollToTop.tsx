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
        "btn-gradient fixed bottom-[90px] sm:bottom-8 right-6 sm:right-8 z-50 rounded-full shadow-2xl transition-all duration-300 transform",
        "hover:scale-110 active:scale-95 border-none",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      )}
      aria-label="Scroll to top"
    >
      <ArrowUpIcon className="size-5" />
    </Button>
  );
}
