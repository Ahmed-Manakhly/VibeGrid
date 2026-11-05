export interface IQARepository {
  acceptSolution(params: {
    questionId: string;
    answerCommentId: string;
    authorId: string;
  }): Promise<{
    post: { id: string; solvedAt: Date | null; acceptedAnswerId: string | null };
    comment: { id: string; isSolution: boolean; authorId: string };
  }>;

  unacceptSolution(params: {
    questionId: string;
    authorId: string;
  }): Promise<{
    post: { id: string; solvedAt: Date | null; acceptedAnswerId: string | null };
  }>;
}
