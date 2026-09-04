import { IVibeRepository, VibePost } from "../domain/IVibeRepository";
import { Result, success, failure } from "@/shared/kernel/Result";
import { PrismaClient } from "@prisma/client";
import { ExplorePostsCriteria, ExplorePostsResult } from "../domain/ExplorePostsCriteria";
import { FeedQueryBuilder } from "@/shared/infrastructure/persistence/query/FeedQueryBuilder";
import { vibeFeedQueryConfig } from "./VibeFeedQueryConfig";

export class PrismaVibeRepository implements IVibeRepository {
  constructor(private db: PrismaClient) {}

  async create(data: { content: string; imageUrl: string; authorId: string; categoryId?: string; vibeId?: string; tags?: string[] }, tx?: any): Promise<Result<any>> {
    try {
      const db = tx || this.db;
      const postData: any = {
      content: data.content,
      image: data.imageUrl,
      authorId: data.authorId,
    };

    if (data.categoryId) postData.categoryId = data.categoryId;
    if (data.vibeId) postData.vibeId = data.vibeId;

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
    } catch (error) {
      console.error("[PrismaVibeRepository] Error creating vibe", error);
      return failure(new Error("Failed to create vibe"));
    }
  }

  async deletePost(id: string, authorId: string, tx?: any): Promise<Result<void>> {
    try {
      const db = tx || this.db;
      const post = await db.post.findUnique({
        where: { id },
        select: { authorId: true },
      });

      if (!post) return failure(new Error("post not found!"));
      if (post.authorId !== authorId)
        return failure(new Error("you are not the author of this post!"));

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

  async getPostsByIds(postIds: string[]): Promise<VibePost[]> {
    if (!postIds || postIds.length === 0) return [];
    const posts = await this.db.post.findMany({
      where: { id: { in: postIds } },
      include: vibeFeedQueryConfig.defaultRelations,
    });
    const postMap = new Map(posts.map((p) => [p.id, p as unknown as VibePost]));
    return postIds.map((id) => postMap.get(id)).filter(Boolean) as VibePost[];
  }

  async getFeed(params: ExplorePostsCriteria = {}): Promise<ExplorePostsResult<VibePost>> {
    const queryBuilder = new FeedQueryBuilder<VibePost>(
      this.db.post,
      params,
      vibeFeedQueryConfig
    );
    return queryBuilder.execute();
  }
}
