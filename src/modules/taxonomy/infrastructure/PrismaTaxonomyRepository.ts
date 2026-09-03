import { ITaxonomyRepository, Category, Vibe, Tag } from "../domain/ITaxonomyRepository";
import { PrismaClient } from "@prisma/client";

export class PrismaTaxonomyRepository implements ITaxonomyRepository {
  constructor(private db: PrismaClient) {}

  async getCategories(): Promise<Category[]> {
    return this.db.category.findMany({
      orderBy: { name: "asc" },
    });
  }

  async getVibes(): Promise<Vibe[]> {
    return this.db.vibe.findMany({
      orderBy: { label: "asc" },
    });
  }

  async getTags(limit: number): Promise<Tag[]> {
    return this.db.tag.findMany({
      take: limit,
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
    });
  }

  async getTrendingTags(limit: number): Promise<any[]> {
    // Trending = tags from posts created in the last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await this.db.postTag.groupBy({
      by: ["tagId"],
      where: {
        post: {
          createdAt: {
            gte: twentyFourHoursAgo,
          },
        },
      },
      _count: {
        postId: true,
      },
      orderBy: {
        _count: {
          postId: "desc",
        },
      },
      take: limit,
    });

    const tagIds = result.map((r) => r.tagId);
    const tags = await this.db.tag.findMany({
      where: { id: { in: tagIds } },
    });

    return result
      .map((r) => ({
        tag: tags.find((t) => t.id === r.tagId),
        recentCount: r._count.postId,
      }))
      .filter((item): item is { tag: any; recentCount: number } => Boolean(item.tag));
  }

  async createCategory(data: { name: string; slug: string; emoji?: string }): Promise<Category> {
    return this.db.category.create({
      data,
    });
  }

  async createVibe(data: { key: string; label: string }): Promise<Vibe> {
    return this.db.vibe.create({
      data,
    });
  }
}
