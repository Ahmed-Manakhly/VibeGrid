import { IVibeRepository, VibePost } from "../domain/IVibeRepository";
import { Result, success, failure } from "@/shared/kernel/Result";
import { PrismaClient } from "@prisma/client";
import { ExplorePostsCriteria, ExplorePostsResult } from "../domain/ExplorePostsCriteria";
import { FeedQueryBuilder } from "@/shared/infrastructure/persistence/query/FeedQueryBuilder";
import { vibeFeedQueryConfig, getVibeFeedRelations } from "./VibeFeedQueryConfig";

export class PrismaVibeRepository implements IVibeRepository {
  constructor(private db: PrismaClient) {}

  async create(data: { content: string; mediaUrl?: string; mediaType?: any; authorId: string; categoryId?: string; vibeId?: string; tags?: string[]; techContext?: any; postType?: any; poll?: { question: string; options: string[]; durationHours: number }; quotedPostId?: string; communityId?: string }, tx?: any): Promise<Result<any>> {
    try {
      const db = tx || this.db;
      const postData: any = {
      content: data.content,
      authorId: data.authorId,
    };

    if (data.mediaUrl) postData.mediaUrl = data.mediaUrl;
    if (data.mediaType) postData.mediaType = data.mediaType;

    if (data.categoryId) postData.categoryId = data.categoryId;
    if (data.vibeId) postData.vibeId = data.vibeId;
    if (data.techContext) postData.techContext = data.techContext;
    if (data.postType) postData.postType = data.postType;
    if (data.quotedPostId) postData.quotedPostId = data.quotedPostId;
    if (data.communityId) postData.communityId = data.communityId;

    if (data.poll && data.poll.options && data.poll.options.length >= 2) {
      const expiresAt = new Date(Date.now() + (data.poll.durationHours || 24) * 60 * 60 * 1000);
      postData.postType = "DILEMMA_POLL";
      postData.poll = {
        create: {
          question: data.poll.question,
          expiresAt,
          options: {
            create: data.poll.options.map((opt, idx) => ({
              text: opt.trim(),
              index: idx,
            })),
          },
        },
      };
    }

    if (data.tags && data.tags.length > 0) {
      postData.tags = {
        create: data.tags.map((tagSlug) => ({
          tag: {
            connectOrCreate: {
              where: { slug: tagSlug },
              create: { name: tagSlug, slug: tagSlug },
            },
          },
        })),
      };
    }

      const post = await db.post.create({
        data: postData,
      });
      return success(post);
    } catch (error: any) {
      const { logger } = require("@/shared/infrastructure/di-container");
      logger.error("[PrismaVibeRepository] Error creating vibe", error);
      const message = error?.message || (error?.code ? `Database error (${error.code})` : "Failed to create vibe");
      return failure(new Error(message));
    }
  }

  async deletePost(id: string, authorId: string, tx?: any): Promise<Result<void>> {
    try {
      const db = tx || this.db;
      const post = await db.post.findUnique({
        where: { id },
        select: {
          authorId: true,
          communityId: true,
          community: {
            select: {
              creatorId: true,
              members: {
                where: { userId: authorId },
                select: { role: true },
              },
            },
          },
        },
      });

      if (!post) return failure(new Error("post not found!"));

      const isAuthor = post.authorId === authorId;
      const isCommunityCreator = post.community?.creatorId === authorId;
      const userMemberRole = post.community?.members?.[0]?.role;
      const isCommunityAdminOrMod = userMemberRole === "ADMIN" || userMemberRole === "MODERATOR";

      if (!isAuthor && !isCommunityCreator && !isCommunityAdminOrMod) {
        return failure(new Error("You do not have permission to delete this vibe!"));
      }

      await db.post.delete({ where: { id } });
      return success(undefined);
    } catch (error) {
      console.error("[PrismaVibeRepository] Error deleting vibe", error);
      return failure(new Error("Failed to delete vibe"));
    }
  }

  async getPostById(postId: string): Promise<any | null> {
    return this.db.post.findUnique({ 
      where: { id: postId },
      include: vibeFeedQueryConfig.defaultRelations
    });
  }

  async getPostsByIds(postIds: string[], viewerId?: string): Promise<VibePost[]> {
    if (!postIds || postIds.length === 0) return [];
    const posts = await this.db.post.findMany({
      where: { id: { in: postIds } },
      include: getVibeFeedRelations(viewerId),
    });
    const postMap = new Map(posts.map((p) => [p.id, p as unknown as VibePost]));
    return postIds.map((id) => postMap.get(id)).filter(Boolean) as VibePost[];
  }

  async getFeed(params: ExplorePostsCriteria = {}): Promise<ExplorePostsResult<VibePost>> {
    if (params.search && params.search.trim()) {
      try {
        const searchTerm = params.search.trim();
        const limit = Math.min(params.limit || 12, 50);

        // Native PostgreSQL Full-Text Search with ts_rank ordering for posts (including author & tags metadata)
        const matchedPostIds: { id: string; rank: number }[] = await this.db.$queryRaw`
          SELECT 
            p.id,
            ts_rank(
              to_tsvector('english', 
                coalesce(p.content, '') || ' ' || 
                coalesce(u.name, '') || ' ' || 
                coalesce(u.username, '') || ' ' ||
                coalesce(string_agg(t.name, ' '), '')
              ),
              websearch_to_tsquery('english', ${searchTerm})
            ) as rank
          FROM "Post" p
          LEFT JOIN "User" u ON p."authorId" = u.id
          LEFT JOIN "PostTag" pt ON p.id = pt."postId"
          LEFT JOIN "Tag" t ON pt."tagId" = t.id
          WHERE to_tsvector('english', 
            coalesce(p.content, '') || ' ' || 
            coalesce(u.name, '') || ' ' || 
            coalesce(u.username, '') || ' ' ||
            coalesce(string_agg(t.name, ' '), '')
          ) @@ websearch_to_tsquery('english', ${searchTerm})
          GROUP BY p.id, u.id
          ORDER BY rank DESC, p."createdAt" DESC
          LIMIT ${limit + 1};
        `;

        if (matchedPostIds && matchedPostIds.length > 0) {
          const hasMore = matchedPostIds.length > limit;
          const targetIds = hasMore ? matchedPostIds.slice(0, limit) : matchedPostIds;
          const ids = targetIds.map((p) => p.id);

          const posts = await this.getPostsByIds(ids, params.userId);
          const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].id : null;

          return {
            data: posts,
            nextCursor,
          };
        }
      } catch (err) {
        console.error("[PrismaVibeRepository] FTS error, falling back to FeedQueryBuilder", err);
      }
    }

    const queryBuilder = new FeedQueryBuilder<VibePost>(
      this.db.post,
      params,
      vibeFeedQueryConfig,
      getVibeFeedRelations(params.userId)
    );
    return queryBuilder.execute();
  }

  async getTrendingShips(limit: number = 10): Promise<any[]> {
    try {
      const posts = await this.db.post.findMany({
        where: {
          OR: [
            { postType: 'PROJECT_SHIP' },
            { techContext: { path: ['isShip'], equals: true } },
          ],
        },
        include: {
          author: {
            select: { id: true, name: true, username: true, image: true },
          },
          likes: { select: { userId: true } },
          bookmarks: { select: { userId: true } },
          _count: {
            select: { likes: true, bookmarks: true, comments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Candidate pool
      });

      return posts;
    } catch (err) {
      console.error("[PrismaVibeRepository] Error fetching trending ships", err);
      return [];
    }
  }
}
