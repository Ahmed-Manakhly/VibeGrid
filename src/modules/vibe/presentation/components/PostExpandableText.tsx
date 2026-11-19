'use client';

import { useState } from 'react';

interface PostExpandableTextProps {
  content: string;
  limit?: number;
  className?: string;
}

export function PostExpandableText({
  content,
  limit = 200,
  className = "text-[14px] sm:text-base text-foreground leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]",
}: PostExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = content.length > limit;

  if (!shouldTruncate) {
    return <p className={className}>{content}</p>;
  }

  return (
    <div className="space-y-1.5">
      <p className={className}>
        {isExpanded ? content : `${content.slice(0, limit)}...`}
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        className="inline-flex items-center text-xs font-semibold text-primary hover:underline transition-colors focus:outline-none"
      >
        {isExpanded ? 'Show less ↑' : 'Show more ↓'}
      </button>
    </div>
  );
}
