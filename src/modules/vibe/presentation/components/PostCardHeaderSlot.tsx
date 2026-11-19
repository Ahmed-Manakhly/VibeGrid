'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface PostCardHeaderSlotProps {
  postId: string;
  isDetailPage?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function PostCardHeaderSlot({
  postId,
  isDetailPage = false,
  className = '',
  children,
}: PostCardHeaderSlotProps) {
  const router = useRouter();

  const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDetailPage) return;

    // Check if clicked element or any ancestor is an interactive tag (link, button, input, dialog)
    const target = e.target as HTMLElement | null;
    if (target?.closest('a, button, input, textarea, select, [role="button"], [data-radix-collection-item]')) {
      return;
    }

    router.push(`/explore/${postId}`);
  };

  return (
    <div
      onClick={handleHeaderClick}
      className={`${className} ${!isDetailPage ? 'cursor-pointer select-text' : ''}`}
    >
      {children}
    </div>
  );
}

