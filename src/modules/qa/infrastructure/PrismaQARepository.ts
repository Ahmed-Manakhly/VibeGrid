import { PrismaClient } from "@prisma/client";
import { IQARepository } from "../domain/IQARepository";

export class PrismaQARepository implements IQARepository {
  constructor(private prisma: PrismaClient) {}

  async acceptSolution(params: {
    questionId: string;
    answerCommentId: string;
    authorId: string;
  }): Promise<{
    post: { id: string; solvedAt: Date | null; acceptedAnswerId: string | null };
    comment: { id: string; isSolution: boolean; authorId: string };
  }> {
    return await this.prisma.$transaction(async (tx: any) => {
      // 1. Verify question post and author ownership
      const post = await tx.post.findUnique({
        where: { id: params.questionId },
        select: { id: true, authorId: true, acceptedAnswerId: true },
      });

      if (!post) {
        throw new Error("Question not found");
      }

      if (post.authorId !== params.authorId) {
        throw new Error("Unauthorized: Only question author can accept a solution");
      }

      // 2. Verify answer comment belongs to this question
      const comment = await tx.comment.findUnique({
        where: { id: params.answerCommentId },
        select: { id: true, postId: true, authorId: true, isSolution: true },
      });

      if (!comment || comment.postId !== params.questionId) {
        throw new Error("Answer comment not found on this question");
      }

      // 3. If another comment was already marked as accepted solution, revert it
      if (post.acceptedAnswerId && post.acceptedAnswerId !== params.answerCommentId) {
        const prevAnswer = await tx.comment.findUnique({
          where: { id: post.acceptedAnswerId },
          select: { id: true, authorId: true },
        });

        await tx.comment.update({
          where: { id: post.acceptedAnswerId },
          data: { isSolution: false },
        });

        if (prevAnswer) {
          await tx.user.update({
            where: { id: prevAnswer.authorId },
            data: { solutionsCount: { decrement: 1 } },
          });
        }
      }

      // 4. Mark answer as solution
      const updatedComment = await tx.comment.update({
        where: { id: params.answerCommentId },
        data: { isSolution: true },
        select: { id: true, isSolution: true, authorId: true },
      });

      // 5. Update question post with accepted answer and solved timestamp
      const updatedPost = await tx.post.update({
        where: { id: params.questionId },
        data: {
          acceptedAnswerId: params.answerCommentId,
          solvedAt: new Date(),
        },
        select: { id: true, solvedAt: true, acceptedAnswerId: true },
      });

      // 6. Increment solver's solutionsCount if this is newly accepted
      if (!comment.isSolution) {
        await tx.user.update({
          where: { id: comment.authorId },
          data: { solutionsCount: { increment: 1 } },
        });
      }

      return {
        post: updatedPost,
        comment: updatedComment,
      };
    });
  }

  async unacceptSolution(params: {
    questionId: string;
    authorId: string;
  }): Promise<{
    post: { id: string; solvedAt: Date | null; acceptedAnswerId: string | null };
  }> {
    return await this.prisma.$transaction(async (tx: any) => {
      const post = await tx.post.findUnique({
        where: { id: params.questionId },
        select: { id: true, authorId: true, acceptedAnswerId: true },
      });

      if (!post) {
        throw new Error("Question not found");
      }

      if (post.authorId !== params.authorId) {
        throw new Error("Unauthorized: Only question author can unaccept a solution");
      }

      if (post.acceptedAnswerId) {
        const comment = await tx.comment.findUnique({
          where: { id: post.acceptedAnswerId },
          select: { id: true, authorId: true },
        });

        await tx.comment.update({
          where: { id: post.acceptedAnswerId },
          data: { isSolution: false },
        });

        if (comment) {
          await tx.user.update({
            where: { id: comment.authorId },
            data: { solutionsCount: { decrement: 1 } },
          });
        }
      }

      const updatedPost = await tx.post.update({
        where: { id: params.questionId },
        data: {
          acceptedAnswerId: null,
          solvedAt: null,
        },
        select: { id: true, solvedAt: true, acceptedAnswerId: true },
      });

      return { post: updatedPost };
    });
  }
}
