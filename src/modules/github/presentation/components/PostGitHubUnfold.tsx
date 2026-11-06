'use client';

import React, { useEffect, useState } from 'react';
import { GitHubRepoMetadata, GitHubUrlParser } from '@/modules/github/domain/GitHubRepoMetadata';
import { GitHubRepoCard } from './GitHubRepoCard';
import { fetchGitHubRepoMetadataAction } from '@/actions/github.action';

export interface PostGitHubUnfoldProps {
  content: string;
}

export function PostGitHubUnfold({ content }: PostGitHubUnfoldProps) {
  const [repos, setRepos] = useState<GitHubRepoMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!content) return;
    const matches = GitHubUrlParser.extractAll(content);
    if (matches.length === 0) return;

    let isMounted = true;
    setIsLoading(true);

    const loadRepos = async () => {
      // Limit to 2 unfolded repo cards per post to keep feed clean
      const topMatches = matches.slice(0, 2);
      const fetched: GitHubRepoMetadata[] = [];

      for (const m of topMatches) {
        try {
          const res = await fetchGitHubRepoMetadataAction(m.url);
          if (res.success && res.data) {
            fetched.push(res.data);
          }
        } catch {
          // Graceful fallback: silently continue if individual card fails
        }
      }

      if (isMounted) {
        setRepos(fetched);
        setIsLoading(false);
      }
    };

    loadRepos();

    return () => {
      isMounted = false;
    };
  }, [content]);

  if (repos.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2.5 pt-1.5">
      {repos.map((repo, idx) => (
        <GitHubRepoCard key={`${repo.fullName}-${idx}`} metadata={repo} />
      ))}
    </div>
  );
}
