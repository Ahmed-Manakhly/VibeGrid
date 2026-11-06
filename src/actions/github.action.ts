"use server";

import { GitHubUrlParser, GitHubRepoMetadata } from "@/modules/github/domain/GitHubRepoMetadata";
import { gitHubRepoRepository, logger } from "@/shared/infrastructure/di-container";

export async function fetchGitHubRepoMetadataAction(
  urlOrSlug: string
): Promise<{ success: boolean; data?: GitHubRepoMetadata; error?: string }> {
  try {
    const parsed = GitHubUrlParser.parse(urlOrSlug);
    if (!parsed) {
      return { success: false, error: "Invalid GitHub repository URL" };
    }

    const metadata = await gitHubRepoRepository.getRepoMetadata(parsed.owner, parsed.repo);
    if (!metadata) {
      return { success: false, error: "Repository not found or rate-limited" };
    }

    return { success: true, data: metadata };
  } catch (error: any) {
    logger.error("Error in fetchGitHubRepoMetadataAction", error, { urlOrSlug });
    return { success: false, error: "Failed to fetch repository metadata" };
  }
}

export async function extractGitHubReposAction(
  content: string
): Promise<{ success: boolean; data: GitHubRepoMetadata[] }> {
  try {
    const matches = GitHubUrlParser.extractAll(content);
    if (matches.length === 0) {
      return { success: true, data: [] };
    }

    // Parallel fetch with maximum 3 cards per post to keep UI responsive
    const topMatches = matches.slice(0, 3);
    const results = await Promise.all(
      topMatches.map((m) => gitHubRepoRepository.getRepoMetadata(m.owner, m.repo))
    );

    const validMetadata = results.filter((r): r is GitHubRepoMetadata => r !== null);
    return { success: true, data: validMetadata };
  } catch (error: any) {
    logger.error("Error in extractGitHubReposAction", error);
    return { success: false, data: [] };
  }
}
