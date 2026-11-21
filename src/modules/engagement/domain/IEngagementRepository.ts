import { Result } from "@/shared/kernel/Result";

export interface IEngagementRepository {
  toggleLike(vibeId: string, userId: string): Promise<Result<{ isLiked: boolean; authorId: string }>>;
  toggleReGrid(vibeId: string, userId: string): Promise<Result<{ isReGridded: boolean; authorId: string; regrid?: any }>>;
  toggleBookmark(vibeId: string, userId: string): Promise<Result<{ isBookmarked: boolean; authorId: string }>>;
  addComment(vibeId: string, userId: string, content: string, parentId?: string, mediaUrl?: string, mediaType?: string): Promise<Result<{ commentId: string; authorId: string; parentAuthorId?: string | null; comment: any }>>;
  deleteComment(commentId: string, userId: string): Promise<Result<void>>;
}
