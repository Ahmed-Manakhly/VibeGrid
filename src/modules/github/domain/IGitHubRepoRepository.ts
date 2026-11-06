import { GitHubRepoMetadata } from './GitHubRepoMetadata';

export interface IGitHubRepoRepository {
  getRepoMetadata(owner: string, repo: string): Promise<GitHubRepoMetadata | null>;
}
