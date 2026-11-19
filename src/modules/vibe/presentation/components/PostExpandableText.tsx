'use client';

import { useState } from 'react';

interface PostExpandableTextProps {
  content: string;
  limit?: number;
  className?: string;
}

// Regex to capture full URLs for linkification
const URL_REGEX = /(https?:\/\/[^\s<>"'{}|\\^`]+)/g;

/**
 * Render text with detected URLs converted to clickable blue links
 */
export function renderLinkifiedText(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, index) => {
    if (part.match(/^https?:\/\//i)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-primary hover:underline font-medium break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function PostExpandableText({
  content,
  limit = 200,
  className = "text-[14px] sm:text-base text-foreground leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]",
}: PostExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = content.length > limit;

  if (!shouldTruncate) {
    return <p className={className}>{renderLinkifiedText(content)}</p>;
  }

  const displayText = isExpanded ? content : `${content.slice(0, limit)}...`;

  return (
    <div className="space-y-1.5">
      <p className={className}>
        {renderLinkifiedText(displayText)}
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

