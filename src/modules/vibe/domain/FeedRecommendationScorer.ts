import { VibePost } from "@/modules/vibe/domain/IVibeRepository";

export interface FeedScoringContext {
  userId?: string;
  userInterestedCategoryIds?: Set<string>;
  followedAuthorIds?: Set<string>;
}

export class FeedRecommendationScorer {
  /**
   * Deterministically scores a post based on relevance, relationship, engagement, and freshness.
   * 
   * Formula:
   * score = relevance_score + relationship_score + engagement_score + freshness_score
   */
  public scorePost(post: VibePost, context: FeedScoringContext = {}): number {
    let score = 0;

    // 1. Relationship Signal (+35 points if author is followed by current user)
    if (context.followedAuthorIds && context.followedAuthorIds.has(post.author.id)) {
      score += 35;
    }

    // 2. User Interest Relevance Signal (+25 points if post category matches user interest)
    if (
      context.userInterestedCategoryIds &&
      post.category?.id &&
      context.userInterestedCategoryIds.has(post.category.id)
    ) {
      score += 25;
    }

    // 3. Normalized & Bounded Engagement Signal (Max 30 points)
    // Formula: (likes * 1 + comments * 2 + bookmarks * 3 + regrids * 2.5) / log2(age_hours + 2)
    const likesCount = post._count?.likes || post.likes?.length || 0;
    const commentsCount = post._count?.comments || post.comments?.length || 0;
    const bookmarksCount = post._count?.bookmarks || post.bookmarks?.length || 0;
    const regridsCount = post._count?.regrids || post.regrids?.length || 0;

    const rawEngagementPoints = likesCount * 1.0 + commentsCount * 2.0 + bookmarksCount * 3.0 + regridsCount * 2.5;
    
    const now = new Date().getTime();
    const postTime = new Date(post.createdAt).getTime();
    const ageHours = Math.max(0, (now - postTime) / (1000 * 60 * 60));

    // Gravity time decay factor: (age_hours + 2)^1.5
    const decayFactor = Math.pow(ageHours + 2, 1.5);
    const decayedEngagement = (rawEngagementPoints * 20) / decayFactor;
    
    // Cap engagement contribution to 30 points
    const engagementScore = Math.min(30, decayedEngagement);
    score += engagementScore;

    // 4. Bounded Freshness Signal (Max 20 points for posts within last 48 hours)
    // Linear decay from 20 -> 0 over 48 hours
    const freshnessScore = Math.max(0, 20 * (1 - ageHours / 48));
    score += freshnessScore;

    return Number(score.toFixed(4));
  }

  /**
   * Sorts candidate posts in-place or returned array by calculated score descending
   */
  public rankPosts(posts: VibePost[], context: FeedScoringContext = {}): VibePost[] {
    if (!posts || posts.length === 0) return [];

    const scoredPosts = posts.map((post) => ({
      post,
      score: this.scorePost(post, context),
    }));

    // Sort by score descending; break ties by createdAt descending
    scoredPosts.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime();
    });

    return scoredPosts.map((sp) => sp.post);
  }
}
