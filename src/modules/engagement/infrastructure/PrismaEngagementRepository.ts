import { IEngagementRepository } from "../domain/IEngagementRepository";
import { Result, success, failure } from "@/shared/kernel/Result";
import { PrismaClient } from "@prisma/client";

export class PrismaEngagementRepository implements IEngagementRepository {
  constructor(private db: PrismaClient) {}

  async toggleLike(vibeId: string, userId: string): Promise<Result<{ isLiked: boolean; authorId: string }>> {
    try {
      const post = await this.db.post.findUnique({
        where: { id: vibeId },
        select: { authorId: true },
      });
      if (!post) return failure(new Error("post not found!"));

      const exLike = await this.db.like.findUnique({
        where: { userId_postId: { postId: vibeId, userId } },
      });

      if (exLike) {
        await this.db.like.delete({
          where: { userId_postId: { postId: vibeId, userId } },
        });
        return success({ isLiked: false, authorId: post.authorId });
      } else {
        await this.db.like.create({
          data: { postId: vibeId, userId },
        });
        return success({ isLiked: true, authorId: post.authorId });
      }
    } catch (err) {
      return failure(new Error("failed to toggle like"));
    }
  }

  async toggleReGrid(vibeId: string, userId: string): Promise<Result<{ isReGridded: boolean; authorId: string; regrid?: any }>> {
    try {
      const post = await this.db.post.findUnique({
        where: { id: vibeId },
        select: { authorId: true },
      });
      if (!post) return failure(new Error("post not found!"));

      const exReGrid = await this.db.reGrid.findUnique({
        where: { userId_postId: { postId: vibeId, userId } },
      });

      if (exReGrid) {
        await this.db.reGrid.delete({
          where: { userId_postId: { postId: vibeId, userId } },
        });
        return success({ isReGridded: false, authorId: post.authorId });
      } else {
        const regrid = await this.db.reGrid.create({
          data: { postId: vibeId, userId },
        });
        return success({ isReGridded: true, authorId: post.authorId, regrid });
      }
    } catch (err) {
      return failure(new Error("failed to toggle regrid"));
    }
  }

  async addComment(vibeId: string, userId: string, content: string): Promise<Result<{ commentId: string; authorId: string, comment: any }>> {
    try {
      const post = await this.db.post.findUnique({
        where: { id: vibeId },
        select: { authorId: true },
      });
      if (!post) return failure(new Error("post not found!"));

      const newComment = await this.db.comment.create({
        data: { content, authorId: userId, postId: vibeId },
      });

      return success({ commentId: newComment.id, authorId: post.authorId, comment: newComment });
    } catch (err) {
      return failure(new Error("failed to create comment"));
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<Result<void>> {
    try {
      const comment = await this.db.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) return failure(new Error("comment not found"));
      
      if (comment.authorId !== userId) {
        return failure(new Error("unauthorized"));
      }

      await this.db.comment.delete({
        where: { id: commentId },
      });
      
      return success(undefined);
    } catch (err) {
      return failure(new Error("failed to delete comment"));
    }
  }
}
