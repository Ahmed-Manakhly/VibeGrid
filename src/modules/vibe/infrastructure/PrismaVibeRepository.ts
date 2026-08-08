import { IVibeRepository, CreateVibeDTO, VibeFeedItem } from "../domain/IVibeRepository";
import { Result, success, failure } from "@/shared/kernel/Result";
import { PrismaClient } from "@prisma/client";

export class PrismaVibeRepository implements IVibeRepository {
  constructor(private db: PrismaClient) {}

  async create(data: CreateVibeDTO): Promise<Result<any>> {
    try {
      const post = await this.db.post.create({
        data: {
          content: data.content,
          image: data.image,
          authorId: data.authorId,
          tags: data.tags || [],
          mood: data.mood,
        },
      });
      return success(post);
    } catch (error) {
      console.error("[PrismaVibeRepository] Error creating vibe", error);
      return failure(new Error("Failed to create vibe"));
    }
  }

  async delete(id: string, authorId: string): Promise<Result<void>> {
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

  async getFeed(): Promise<VibeFeedItem[]> {
    return this.db.post.findMany({
      include: {
        author: {
          select: { id: true, name: true, image: true, username: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, image: true, username: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        likes: { select: { userId: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
