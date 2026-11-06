import { VibePost } from "./IVibeRepository";

export interface TrendingShipItem {
  id: string;
  projectName: string;
  tagline: string;
  demoUrl?: string;
  repoUrl?: string;
  techStack: string[];
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  upvotesCount: number;
  bookmarksCount: number;
  commentsCount: number;
  score: number;
  createdAt: string;
}

export class TrendingShipsScorer {
  /**
   * Computes a launchpad ranking score using decayed engagement velocity.
   * 
   * Score = (upvotes * 3.0 + bookmarks * 2.0 + comments * 1.5) / (age_hours + 2)^1.2
   */
  public static calculateShipScore(
    upvotes: number,
    bookmarks: number,
    comments: number,
    createdAt: Date | string
  ): number {
    const now = Date.now();
    const createdTime = new Date(createdAt).getTime();
    const ageHours = Math.max(0, (now - createdTime) / (1000 * 60 * 60));

    const weightedPoints = upvotes * 3.0 + bookmarks * 2.0 + comments * 1.5;
    const decay = Math.pow(ageHours + 2, 1.2);

    return Number((weightedPoints / decay).toFixed(4));
  }

  /**
   * Transforms and ranks raw ship posts by calculated score descending.
   */
  public static rankShipPosts(posts: any[]): TrendingShipItem[] {
    const items: TrendingShipItem[] = [];

    for (const p of posts) {
      const tc = p.techContext;
      if (!tc || !tc.projectName) continue;

      const upvotes = p._count?.likes ?? p.likes?.length ?? 0;
      const bookmarks = p._count?.bookmarks ?? p.bookmarks?.length ?? 0;
      const comments = p._count?.comments ?? p.comments?.length ?? 0;

      const score = this.calculateShipScore(upvotes, bookmarks, comments, p.createdAt);

      items.push({
        id: p.id,
        projectName: tc.projectName,
        tagline: tc.tagline || "",
        demoUrl: tc.demoUrl,
        repoUrl: tc.repoUrl,
        techStack: Array.isArray(tc.techStack) ? tc.techStack : [],
        author: {
          id: p.author.id,
          name: p.author.name,
          username: p.author.username,
          image: p.author.image,
        },
        upvotesCount: upvotes,
        bookmarksCount: bookmarks,
        commentsCount: comments,
        score,
        createdAt: new Date(p.createdAt).toISOString(),
      });
    }

    // Sort by score descending; break ties by createdAt descending
    items.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return items;
  }
}
