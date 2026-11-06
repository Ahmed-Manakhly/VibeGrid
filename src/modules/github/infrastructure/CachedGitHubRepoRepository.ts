import { GitHubRepoMetadata } from '../domain/GitHubRepoMetadata';
import { IGitHubRepoRepository } from '../domain/IGitHubRepoRepository';
import { ICacheService } from '@/shared/application/ports/ICacheService';
import { ILogger } from '@/shared/application/ports/ILogger';

export class CachedGitHubRepoRepository implements IGitHubRepoRepository {
  private static readonly CACHE_TTL_SECONDS = 3600; // 1-hour cache
  private static readonly CACHE_PREFIX = 'vibegrid:github:repo:';

  constructor(
    private cacheService?: ICacheService,
    private logger?: ILogger
  ) {}

  public async getRepoMetadata(owner: string, repo: string): Promise<GitHubRepoMetadata | null> {
    if (!owner || !repo) return null;

    const normalizedOwner = owner.trim().toLowerCase();
    const normalizedRepo = repo.trim().toLowerCase();
    const cacheKey = `${CachedGitHubRepoRepository.CACHE_PREFIX}${normalizedOwner}:${normalizedRepo}`;

    // 1. Try Cache
    if (this.cacheService) {
      try {
        const cached = await this.cacheService.get<GitHubRepoMetadata>(cacheKey);
        if (cached) {
          this.logger?.debug('[CachedGitHubRepoRepository] Cache hit', { owner, repo, cacheKey });
          return cached;
        }
      } catch (err) {
        this.logger?.warn('[CachedGitHubRepoRepository] Cache read error, continuing to fetch', { error: err });
      }
    }

    // 2. Fetch from GitHub REST API
    try {
      const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VibeGrid-App/1.0',
      };

      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      const res = await fetch(apiUrl, {
        headers,
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        this.logger?.warn('[CachedGitHubRepoRepository] GitHub API responded with error', {
          owner,
          repo,
          status: res.status,
        });
        return null;
      }

      const data = await res.json();

      const metadata: GitHubRepoMetadata = {
        owner: data.owner?.login || owner,
        repo: data.name || repo,
        fullName: data.full_name || `${owner}/${repo}`,
        description: data.description || null,
        starsCount: Number(data.stargazers_count) || 0,
        forksCount: Number(data.forks_count) || 0,
        openIssuesCount: Number(data.open_issues_count) || 0,
        primaryLanguage: data.language || null,
        license: data.license?.spdx_id || data.license?.name || null,
        htmlUrl: data.html_url || `https://github.com/${owner}/${repo}`,
        updatedAt: data.updated_at || new Date().toISOString(),
      };

      // 3. Populate Cache
      if (this.cacheService) {
        await this.cacheService.set(cacheKey, metadata, CachedGitHubRepoRepository.CACHE_TTL_SECONDS).catch((err) => {
          this.logger?.warn('[CachedGitHubRepoRepository] Cache set error', { error: err });
        });
      }

      return metadata;
    } catch (error) {
      this.logger?.error('[CachedGitHubRepoRepository] Unexpected error fetching repo metadata', {
        owner,
        repo,
        error,
      });
      return null;
    }
  }
}
