"use client";

import { useState, useEffect, useRef } from "react";

interface ScrollDirectionOptions {
  threshold?: number;
  topOffset?: number;
}

export function useScrollDirection({
  threshold = 12,
  topOffset = 60,
}: ScrollDirectionOptions = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    // Initialize with current scroll position
    lastScrollYRef.current = window.scrollY;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;

      // Always show chrome if user is near top of page
      if (currentScrollY <= topOffset) {
        setIsVisible(true);
        setScrollDirection("up");
        lastScrollYRef.current = currentScrollY;
        tickingRef.current = false;
        return;
      }

      // Ignore overscroll / elastic bounce on iOS Safari
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
      if (currentScrollY < 0 || currentScrollY > maxScrollY) {
        tickingRef.current = false;
        return;
      }

      const diff = currentScrollY - lastScrollYRef.current;

      // Only toggle if scroll delta exceeds threshold
      if (Math.abs(diff) >= threshold) {
        if (diff > 0) {
          // Scrolling DOWN -> Hide chrome
          setIsVisible(false);
          setScrollDirection("down");
        } else {
          // Scrolling UP -> Show chrome
          setIsVisible(true);
          setScrollDirection("up");
        }
        lastScrollYRef.current = currentScrollY;
      }

      tickingRef.current = false;
    };

    const onScroll = () => {
      if (!tickingRef.current) {
        window.requestAnimationFrame(updateScrollDirection);
        tickingRef.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, topOffset]);

  return { isVisible, scrollDirection, setIsVisible };
}

