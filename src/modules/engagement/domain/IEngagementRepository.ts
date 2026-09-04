import { Result } from "@/shared/kernel/Result";

export interface IEngagementRepository {
  toggleLike(vibeId: string, userId: string): Promise<Result<{ isLiked: boolean; authorId: string }>>;
  toggleReGrid(vibeId: string, userId: string): Promise<Result<{ isReGridded: boolean; authorId: string; regrid?: any }>>;
  addComment(vibeId: string, userId: string, content: string): Promise<Result<{ commentId: string; authorId: string, comment: any }>>;
  deleteComment(commentId: string, userId: string): Promise<Result<void>>;
}
