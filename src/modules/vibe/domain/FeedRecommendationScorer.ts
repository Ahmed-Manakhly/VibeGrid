import { VibePost } from "@/modules/vibe/domain/IVibeRepository";

export interface FeedScoringContext {
  userId?: string;
  userInterestedCategoryIds?: Set<string>;
  followedAuthorIds?: Set<string>;
  followedTagIds?: Set<string>;
}

export class FeedRecommendationScorer {
  /**
   * Deterministically scores a post based on relevance, relationship, engagement, and freshness.
   * 
   * Formula:
   * score = relevance_score + relationship_score + engagement_score + freshness_score
   */
  /**
   * Calculates the effective chronological timestamp of a post.
   * If the post has been re-gridded, the latest relevant regrid timestamp
   * takes precedence so the post resurfaces at the top of the feed.
   */
  public getEffectiveTimestamp(post: VibePost, context: FeedScoringContext = {}): number {
    let effective = new Date(post.createdAt).getTime();

    if (post.regrids && post.regrids.length > 0) {
      for (const regrid of post.regrids) {
        if (!regrid.createdAt) continue;
        const regridTime = new Date(regrid.createdAt).getTime();

        // If viewed by a user, prioritize regrids made by followed developers or the viewer
        const isFollowedReposter = context.followedAuthorIds && context.followedAuthorIds.has(regrid.userId);
        const isSelfReposter = context.userId && regrid.userId === context.userId;

        if (isFollowedReposter || isSelfReposter) {
          if (regridTime > effective) {
            effective = regridTime;
          }
        } else if (regridTime > effective) {
          effective = regridTime;
        }
      }
    }

    return effective;
  }

  public scorePost(post: VibePost, context: FeedScoringContext = {}): number {
    let score = 0;

    // 1. Relationship Signal (+35 points if author is followed by current user)
    if (context.followedAuthorIds && context.followedAuthorIds.has(post.author.id)) {
      score += 35;
    }

    // 1.1 Reposter Relationship Signal (+35 points if anyone who re-gridded this post is followed by current user)
    if (context.followedAuthorIds && post.regrids && post.regrids.length > 0) {
      const isReGriddedByFollowed = post.regrids.some((r) => context.followedAuthorIds!.has(r.userId));
      if (isReGriddedByFollowed) {
        score += 35;
      }
    }

    // 2. User Interest & Followed Tech Tags Relevance Signal (+25 points each)
    if (
      context.userInterestedCategoryIds &&
      post.category?.id &&
      context.userInterestedCategoryIds.has(post.category.id)
    ) {
      score += 25;
    }

    // Followed Technology Tag Boost (+25 points if post has a tag the user follows)
    if (context.followedTagIds && post.tags && post.tags.length > 0) {
      const hasFollowedTag = post.tags.some(t => context.followedTagIds!.has(t.tag.id) || context.followedTagIds!.has(t.tag.slug));
      if (hasFollowedTag) {
        score += 25;
      }
    }

    // 3. Normalized & Bounded Engagement Signal (Max 30 points)
    // Formula: (likes * 1 + comments * 2 + bookmarks * 3 + regrids * 2.5) / log2(age_hours + 2)
    const likesCount = post._count?.likes || post.likes?.length || 0;
    const commentsCount = post._count?.comments || post.comments?.length || 0;
    const bookmarksCount = post._count?.bookmarks || post.bookmarks?.length || 0;
    const regridsCount = post._count?.regrids || post.regrids?.length || 0;

    const rawEngagementPoints = likesCount * 1.0 + commentsCount * 2.0 + bookmarksCount * 3.0 + regridsCount * 2.5;
    
    const now = new Date().getTime();
    const effectiveTime = this.getEffectiveTimestamp(post, context);
    const ageHours = Math.max(0, (now - effectiveTime) / (1000 * 60 * 60));

    // Gravity time decay factor: (age_hours + 2)^1.5
    const decayFactor = Math.pow(ageHours + 2, 1.5);
    const decayedEngagement = (rawEngagementPoints * 20) / decayFactor;
    
    // Cap engagement contribution to 30 points
    const engagementScore = Math.min(30, decayedEngagement);
    score += engagementScore;

    // 4. Bounded Freshness Signal (Max 20 points for posts/re-grids within last 48 hours)
    // Linear decay from 20 -> 0 over 48 hours
    const freshnessScore = Math.max(0, 20 * (1 - ageHours / 48));
    score += freshnessScore;

    // 5. Developer Technical Content Signal (+15 points for interactive polls or shipped projects)
    if (post.poll || post.postType === 'DILEMMA_POLL') {
      score += 15;
    }
    if (post.techContext?.isShip || post.postType === 'PROJECT_SHIP' || post.postType === 'ship') {
      score += 15;
    }

    return Number(score.toFixed(4));
  }

  /**
   * Sorts candidate posts in-place or returned array by calculated score descending
   */
  public rankPosts(posts: VibePost[], context: FeedScoringContext = {}): VibePost[] {
    if (!posts || posts.length === 0) return [];

    // Calculate effective chronological timestamp (creation, quote, or regrid)
    // Sort strictly by effective timestamp descending so latest content is at the top
    const postsWithTime = posts.map((post) => ({
      post,
      effectiveTime: this.getEffectiveTimestamp(post, context),
      score: this.scorePost(post, context),
    }));

    postsWithTime.sort((a, b) => {
      if (b.effectiveTime !== a.effectiveTime) {
        return b.effectiveTime - a.effectiveTime;
      }
      return b.score - a.score;
    });

    return postsWithTime.map((item) => item.post);
  }
}
