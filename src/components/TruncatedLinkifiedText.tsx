'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Regex to capture full URLs, @mentions, and #hashtags
const TOKEN_REGEX = /(https?:\/\/[^\s<>"'{}|\\^`]+|@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+)/g;

/**
 * Render text with detected URLs, @mentions, and #hashtags converted to interactive links
 */
export function renderLinkifiedText(text: string, linkClassName = "text-primary hover:underline font-medium break-all") {
  if (!text) return null;
  const parts = text.split(TOKEN_REGEX);

  return parts.map((part, index) => {
    if (!part) return null;

    // 1. External or internal HTTP/HTTPS URL
    if (part.match(/^https?:\/\//i)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={linkClassName}
        >
          {part}
        </a>
      );
    }

    // 2. User Mention (@username)
    if (part.startsWith('@') && part.length > 1) {
      const username = part.slice(1);
      return (
        <Link
          key={index}
          href={`/profile/${username}`}
          onClick={(e) => e.stopPropagation()}
          className="font-semibold text-primary hover:underline hover:text-primary/80 transition-colors"
        >
          {part}
        </Link>
      );
    }

    // 3. Hashtag (#tag)
    if (part.startsWith('#') && part.length > 1) {
      const tagSlug = encodeURIComponent(part.slice(1).toLowerCase());
      return (
        <Link
          key={index}
          href={`/explore?tag=${tagSlug}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-emerald-400 hover:underline hover:text-emerald-300 transition-colors"
        >
          {part}
        </Link>
      );
    }

    return part;
  });
}

interface TruncatedLinkifiedTextProps {
  text?: string;
  content?: string;
  limit?: number;
  className?: string;
  linkClassName?: string;
  showExpandToggle?: boolean;
}

/**
 * Universal component for rich text across VibeGrid:
 * - Linkifies URLs to blue clickable anchors
 * - Linkifies @username to developer profile links
 * - Linkifies #hashtags to taxonomy tag discovery filters
 * - Truncates long text with in-place Show More / Show Less expansion (if enabled)
 */
export function TruncatedLinkifiedText({
  text,
  content,
  limit = 200,
  className = "text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
  linkClassName,
  showExpandToggle = true,
}: TruncatedLinkifiedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const targetText = text ?? content ?? "";

  if (!targetText) return null;

  const shouldTruncate = showExpandToggle && limit > 0 && targetText.length > limit;

  if (!shouldTruncate) {
    return <p className={className}>{renderLinkifiedText(targetText, linkClassName)}</p>;
  }

  const displayText = isExpanded ? targetText : `${targetText.slice(0, limit)}...`;

  return (
    <div className="space-y-1">
      <p className={className}>
        {renderLinkifiedText(displayText, linkClassName)}
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
