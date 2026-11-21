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
        // Bump post updatedAt so regridded posts surface at the top of updated feeds
        await this.db.post.update({
          where: { id: vibeId },
          data: { updatedAt: new Date() },
        });
        return success({ isReGridded: true, authorId: post.authorId, regrid });
      }
    } catch (err) {
      return failure(new Error("failed to toggle regrid"));
    }
  }

  async toggleBookmark(vibeId: string, userId: string): Promise<Result<{ isBookmarked: boolean; authorId: string }>> {
    try {
      const post = await this.db.post.findUnique({
        where: { id: vibeId },
        select: { authorId: true },
      });
      if (!post) return failure(new Error("post not found!"));

      const dbAny = this.db as any;
      const exBookmark = await dbAny.bookmark.findUnique({
        where: { userId_postId: { postId: vibeId, userId } },
      });

      if (exBookmark) {
        await dbAny.bookmark.delete({
          where: { userId_postId: { postId: vibeId, userId } },
        });
        return success({ isBookmarked: false, authorId: post.authorId });
      } else {
        await dbAny.bookmark.create({
          data: { postId: vibeId, userId },
        });
        return success({ isBookmarked: true, authorId: post.authorId });
      }
    } catch (err) {
      return failure(new Error("failed to toggle bookmark"));
    }
  }

  async addComment(vibeId: string, userId: string, content: string, parentId?: string, mediaUrl?: string, mediaType?: string): Promise<Result<{ commentId: string; authorId: string, comment: any }>> {
    try {
      const post = await this.db.post.findUnique({
        where: { id: vibeId },
        select: {
          authorId: true,
          communityId: true,
          community: {
            select: {
              members: {
                where: { userId },
                select: { id: true },
              },
            },
          },
        },
      });
      if (!post) return failure(new Error("post not found!"));

      // If post is in a guild/community, verify that commenter is a member
      if (post.communityId) {
        const isMember = (post.community?.members?.length || 0) > 0;
        if (!isMember) {
          return failure(new Error("You must join this guild before commenting on its vibes!"));
        }
      }

      const newComment = await this.db.comment.create({
        data: { 
          content, 
          authorId: userId, 
          postId: vibeId,
          ...(mediaUrl ? { mediaUrl } : {}),
          ...(mediaType ? { mediaType } : {}),
          ...(parentId ? { parentId } : {})
        },
        include: {
          author: { select: { id: true, name: true, username: true, image: true } },
          likes: { select: { userId: true, user: { select: { id: true, name: true, username: true, image: true } } } },
          _count: { select: { likes: true } },
        }
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
        include: { post: { select: { authorId: true } } },
      });
      if (!comment) return failure(new Error("comment not found"));
      
      // Allow deletion if caller is the comment author OR the owner of the post
      const isCommentAuthor = comment.authorId === userId;
      const isPostAuthor = comment.post?.authorId === userId;
      if (!isCommentAuthor && !isPostAuthor) {
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
