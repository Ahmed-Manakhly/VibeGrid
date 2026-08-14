import { IVibeRepository, VibePost } from "../domain/IVibeRepository";
import { Result, success, failure } from "@/shared/kernel/Result";
import { PrismaClient } from "@prisma/client";
import { FeedQueryParams, FeedResult } from "@/shared/kernel/FeedQueryParams";
import { FeedQueryBuilder } from "@/shared/kernel/FeedQueryBuilder";
import { vibeFeedQueryConfig } from "./VibeFeedQueryConfig";

export class PrismaVibeRepository implements IVibeRepository {
  constructor(private db: PrismaClient) {}

  async create(data: { content: string; imageUrl: string; authorId: string; categoryId?: string; vibeId?: string; tags?: string[] }): Promise<Result<any>> {
    try {
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

      const post = await this.db.post.create({
        data: postData,
      });
      return success(post);
    } catch (error) {
      console.error("[PrismaVibeRepository] Error creating vibe", error);
      return failure(new Error("Failed to create vibe"));
    }
  }

  async deletePost(id: string, authorId: string): Promise<Result<void>> {
    try {
      const post = await this.db.post.findUnique({
        where: { id },
        select: { authorId: true },
      });

      if (!post) return failure(new Error("post not found!"));
      if (post.authorId !== authorId)
        return failure(new Error("you are not the author of this post!"));

      await this.db.post.delete({ where: { id } });
      return success(undefined);
    } catch (error) {
      console.error("[PrismaVibeRepository] Error deleting vibe", error);
      return failure(new Error("Failed to delete vibe"));
    }
  }

  async getPostById(postId: string): Promise<any | null> {
    return this.db.post.findUnique({ where: { id: postId } });
  }

  async getFeed(params: FeedQueryParams = {}): Promise<FeedResult<VibePost>> {
    const queryBuilder = new FeedQueryBuilder<VibePost>(
      this.db.post,
      params,
      vibeFeedQueryConfig
    );
    return queryBuilder.execute();
  }
}
