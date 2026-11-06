export interface GitHubRepoMetadata {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  starsCount: number;
  forksCount: number;
  openIssuesCount: number;
  primaryLanguage: string | null;
  license: string | null;
  htmlUrl: string;
  updatedAt: string;
}

export class GitHubUrlParser {
  private static readonly GITHUB_REPO_REGEX =
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)(?:\/)?(?=[^a-zA-Z0-9._-]|$)/i;

  public static parse(input: string): { owner: string; repo: string } | null {
    if (!input || typeof input !== 'string') return null;
    const match = input.match(this.GITHUB_REPO_REGEX);
    if (!match) return null;

    const owner = match[1];
    let repo = match[2];

    // Exclude common reserved GitHub top-level sections
    const reservedSlugs = [
      'features',
      'explore',
      'trending',
      'topics',
      'collections',
      'events',
      'about',
      'contact',
      'pricing',
      'login',
      'join',
      'settings',
      'notifications',
      'pulls',
      'issues',
      'marketplace',
      'sponsors',
    ];

    if (reservedSlugs.includes(owner.toLowerCase())) {
      return null;
    }

    if (repo.endsWith('.git')) {
      repo = repo.replace(/\.git$/, '');
    }

    // Strip trailing punctuation often found at the end of sentences in markdown
    repo = repo.replace(/[.,:;!?]+$/, '');

    return {
      owner,
      repo,
    };
  }

  public static extractAll(content: string): Array<{ owner: string; repo: string; url: string }> {
    if (!content || typeof content !== 'string') return [];
    const results: Array<{ owner: string; repo: string; url: string }> = [];
    const seen = new Set<string>();

    const globalRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)(?:\/)?(?=[^a-zA-Z0-9._-]|$)/gi;
    let match: RegExpExecArray | null;

    while ((match = globalRegex.exec(content)) !== null) {
      const owner = match[1];
      let repo = match[2];
      const parsed = this.parse(`https://github.com/${owner}/${repo}`);
      if (parsed) {
        const slug = `${parsed.owner}/${parsed.repo}`.toLowerCase();
        if (!seen.has(slug)) {
          seen.add(slug);
          results.push({
            owner: parsed.owner,
            repo: parsed.repo,
            url: `https://github.com/${parsed.owner}/${parsed.repo}`,
          });
        }
      }
    }

    return results;
  }
}
