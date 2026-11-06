import { GitHubUrlParser, GitHubRepoMetadata } from '@/modules/github/domain/GitHubRepoMetadata';
import { CachedGitHubRepoRepository } from '@/modules/github/infrastructure/CachedGitHubRepoRepository';

describe('GitHubUrlParser Domain Tests', () => {
  it('correctly parses standard GitHub repository URLs', () => {
    const parsed1 = GitHubUrlParser.parse('https://github.com/facebook/react');
    expect(parsed1).toEqual({ owner: 'facebook', repo: 'react' });

    const parsed2 = GitHubUrlParser.parse('http://github.com/vercel/next.js');
    expect(parsed2).toEqual({ owner: 'vercel', repo: 'next.js' });

    const parsed3 = GitHubUrlParser.parse('https://github.com/torvalds/linux.git');
    expect(parsed3).toEqual({ owner: 'torvalds', repo: 'linux' });
  });

  it('rejects reserved GitHub top-level paths', () => {
    expect(GitHubUrlParser.parse('https://github.com/features/actions')).toBeNull();
    expect(GitHubUrlParser.parse('https://github.com/explore')).toBeNull();
    expect(GitHubUrlParser.parse('https://github.com/settings/profile')).toBeNull();
    expect(GitHubUrlParser.parse('https://github.com/login')).toBeNull();
  });

  it('extracts unique repositories from post markdown content', () => {
    const postBody = `
      Check out this awesome fullstack setup:
      https://github.com/facebook/react and also https://github.com/vercel/next.js.
      Duplicate reference: https://github.com/facebook/react
    `;

    const repos = GitHubUrlParser.extractAll(postBody);
    expect(repos).toHaveLength(2);
    expect(repos[0].owner).toBe('facebook');
    expect(repos[0].repo).toBe('react');
    expect(repos[1].owner).toBe('vercel');
    expect(repos[1].repo).toBe('next.js');
  });
});

describe('CachedGitHubRepoRepository Unit Tests', () => {
  it('returns cached metadata if present in cache', async () => {
    const mockCache: any = {
      get: jest.fn().mockResolvedValue({
        owner: 'facebook',
        repo: 'react',
        fullName: 'facebook/react',
        description: 'The library for web and native user interfaces',
        starsCount: 220000,
        forksCount: 45000,
        openIssuesCount: 1200,
        primaryLanguage: 'JavaScript',
        license: 'MIT',
        htmlUrl: 'https://github.com/facebook/react',
        updatedAt: '2026-11-06T00:00:00Z',
      }),
      set: jest.fn(),
    };

    const repo = new CachedGitHubRepoRepository(mockCache);
    const result = await repo.getRepoMetadata('facebook', 'react');

    expect(result).not.toBeNull();
    expect(result?.starsCount).toBe(220000);
    expect(result?.primaryLanguage).toBe('JavaScript');
    expect(mockCache.get).toHaveBeenCalledWith('vibegrid:github:repo:facebook:react');
  });

  it('populates cache on successful API response', async () => {
    const mockCache: any = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const mockGitHubData = {
      owner: { login: 'shadcn-ui' },
      name: 'ui',
      full_name: 'shadcn-ui/ui',
      description: 'Beautifully designed components',
      stargazers_count: 65000,
      forks_count: 6000,
      open_issues_count: 80,
      language: 'TypeScript',
      license: { spdx_id: 'MIT' },
      html_url: 'https://github.com/shadcn-ui/ui',
      updated_at: '2026-11-06T00:00:00Z',
    };

    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockGitHubData),
    } as any);

    try {
      const repo = new CachedGitHubRepoRepository(mockCache);
      const result = await repo.getRepoMetadata('shadcn-ui', 'ui');

      expect(result).not.toBeNull();
      expect(result?.fullName).toBe('shadcn-ui/ui');
      expect(result?.starsCount).toBe(65000);
      expect(mockCache.set).toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('returns null gracefully when API returns 404 or fails', async () => {
    const mockCache: any = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn(),
    };

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    try {
      const repo = new CachedGitHubRepoRepository(mockCache);
      const result = await repo.getRepoMetadata('nonexistent', 'nowhere');
      expect(result).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });
});
