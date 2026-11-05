import { PrismaClient } from "@prisma/client";
import { ITagFollowRepository } from "../domain/ITagFollowRepository";

export class PrismaTagFollowRepository implements ITagFollowRepository {
  constructor(private prisma: PrismaClient) {}

  async toggleFollow(userId: string, tagId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
    return await this.prisma.$transaction(async (tx: any) => {
      const existing = await tx.tagFollow.findUnique({
        where: {
          userId_tagId: {
            userId,
            tagId,
          },
        },
      });

      if (existing) {
        await tx.tagFollow.delete({
          where: {
            id: existing.id,
          },
        });
        const updatedTag = await tx.tag.update({
          where: { id: tagId },
          data: {
            followersCount: {
              decrement: 1,
            },
          },
          select: { followersCount: true },
        });

        return {
          isFollowing: false,
          followersCount: Math.max(0, updatedTag.followersCount),
        };
      } else {
        await tx.tagFollow.create({
          data: {
            userId,
            tagId,
          },
        });
        const updatedTag = await tx.tag.update({
          where: { id: tagId },
          data: {
            followersCount: {
              increment: 1,
            },
          },
          select: { followersCount: true },
        });

        return {
          isFollowing: true,
          followersCount: updatedTag.followersCount,
        };
      }
    });
  }

  async isFollowing(userId: string, tagId: string): Promise<boolean> {
    const existing = await this.prisma.tagFollow.findUnique({
      where: {
        userId_tagId: {
          userId,
          tagId,
        },
      },
      select: { id: true },
    });
    return Boolean(existing);
  }

  async getFollowedTagIds(userId: string): Promise<string[]> {
    const follows: { tagId: string }[] = await (this.prisma as any).tagFollow.findMany({
      where: { userId },
      select: { tagId: true },
    });
    return follows.map((f: { tagId: string }) => f.tagId);
  }

  async getFollowedTagSlugs(userId: string): Promise<string[]> {
    const follows: { tag: { slug: string } }[] = await (this.prisma as any).tagFollow.findMany({
      where: { userId },
      select: {
        tag: {
          select: { slug: true },
        },
      },
    });
    return follows.map((f: { tag: { slug: string } }) => f.tag.slug);
  }
}
