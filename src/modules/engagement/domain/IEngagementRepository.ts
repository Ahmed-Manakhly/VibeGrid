import { Result } from "@/shared/kernel/Result";

export interface IEngagementRepository {
  toggleLike(vibeId: string, userId: string): Promise<Result<{ isLiked: boolean; authorId: string }>>;
  addComment(vibeId: string, userId: string, content: string): Promise<Result<{ commentId: string; authorId: string, comment: any }>>;
  deleteComment(commentId: string, userId: string): Promise<Result<void>>;
}
