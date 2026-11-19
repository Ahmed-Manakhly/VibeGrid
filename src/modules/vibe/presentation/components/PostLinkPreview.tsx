'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Globe } from 'lucide-react';

interface LinkPreviewData {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string;
}

interface PostLinkPreviewProps {
  content: string;
}

// Regex to detect standard http/https URLs that are NOT GitHub repos (since PostGitHubUnfold handles those)
const URL_REGEX = /https?:\/\/(?!github\.com\/[^\s/]+\/[^\s/]+)[^\s<>"'{}|\\^`]+/gi;

export function PostLinkPreview({ content }: PostLinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!content) return;
    const matches = content.match(URL_REGEX);
    if (!matches || matches.length === 0) return;

    const firstUrl = matches[0];
    let isMounted = true;
    setIsLoading(true);

    const fetchPreview = async () => {
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(firstUrl)}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.data && (json.data.title || json.data.image)) {
            setPreview(json.data);
          }
        }
      } catch {
        // Silently skip
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [content]);

  if (!preview) return null;

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group mt-2 block overflow-hidden rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all text-left"
    >
      {preview.image && (
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          <img
            src={preview.image}
            alt={preview.title || 'Link Preview'}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
          <Globe className="size-3 text-primary/70 shrink-0" />
          <span className="truncate">{preview.siteName}</span>
          <ExternalLink className="size-2.5 opacity-50 ml-auto group-hover:opacity-100 transition-opacity" />
        </div>
        {preview.title && (
          <h4 className="text-xs sm:text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {preview.title}
          </h4>
        )}
        {preview.description && (
          <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2">
            {preview.description}
          </p>
        )}
      </div>
    </a>
  );
}

