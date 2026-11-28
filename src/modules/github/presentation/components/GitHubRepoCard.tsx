import React from 'react';
import { Star, GitFork, AlertCircle, ExternalLink, Code2 } from 'lucide-react';
import { GitHubRepoMetadata } from '@/modules/github/domain/GitHubRepoMetadata';

export interface GitHubRepoCardProps {
  metadata: GitHubRepoMetadata;
  className?: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
};

export function GitHubRepoCard({ metadata, className = '' }: GitHubRepoCardProps) {
  if (!metadata || !metadata.fullName) return null;

  const languageColor = (metadata.primaryLanguage && LANGUAGE_COLORS[metadata.primaryLanguage]) || '#8b949e';

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  return (
    <div
      className={`relative group/repo overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 via-card/50 to-background/80 p-4 backdrop-blur-md shadow-sm transition-all duration-300 hover:border-accent/40 hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Repository Header */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/20">
            <svg className="size-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <a
              href={metadata.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm font-bold text-foreground hover:text-accent truncate flex items-center gap-1.5 group-hover/repo:underline"
            >
              <span>{metadata.fullName}</span>
              <ExternalLink className="size-3 text-muted-foreground opacity-60 group-hover/repo:opacity-100 shrink-0" />
            </a>
            <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
              OPEN SOURCE REPO
            </span>
          </div>
        </div>

        {/* Stars pill */}
        <a
          href={`${metadata.htmlUrl}/stargazers`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 hover:bg-amber-500/20 transition-colors shrink-0"
        >
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span>{formatCount(metadata.starsCount)}</span>
        </a>
      </div>

      {/* Description */}
      {metadata.description && (
        <p className="mt-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {metadata.description}
        </p>
      )}

      {/* Repository Metrics Footer */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-2 border-t border-border/40 font-mono">
        {/* Language Indicator */}
        {metadata.primaryLanguage && (
          <div className="flex items-center gap-1.5">
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: languageColor }}
            />
            <span className="text-foreground/90 font-medium">{metadata.primaryLanguage}</span>
          </div>
        )}

        {/* Forks */}
        <div className="flex items-center gap-1 text-muted-foreground">
          <GitFork className="size-3.5" />
          <span>{formatCount(metadata.forksCount)}</span>
        </div>

        {/* Open Issues */}
        {metadata.openIssuesCount > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <AlertCircle className="size-3.5" />
            <span>{formatCount(metadata.openIssuesCount)} issues</span>
          </div>
        )}

        {/* License */}
        {metadata.license && (
          <span className="ml-auto text-[11px] px-2 py-0.5 rounded-md bg-secondary/60 text-secondary-foreground border border-border/40">
            {metadata.license}
          </span>
        )}
      </div>
    </div>
  );
}
