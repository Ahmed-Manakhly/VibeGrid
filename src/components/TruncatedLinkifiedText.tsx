'use client';

import React, { useState } from 'react';

// Regex to capture full URLs for linkification
const URL_REGEX = /(https?:\/\/[^\s<>"'{}|\\^`]+)/g;

/**
 * Render text with detected URLs converted to clickable blue links
 */
export function renderLinkifiedText(text: string, linkClassName = "text-primary hover:underline font-medium break-all") {
  if (!text) return null;
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
          className={linkClassName}
        >
          {part}
        </a>
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
