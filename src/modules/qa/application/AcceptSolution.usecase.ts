import { IQARepository } from "../domain/IQARepository";

export class AcceptSolutionUseCase {
  constructor(private qaRepo: IQARepository) {}

  async execute(input: {
    questionId: string;
    answerCommentId: string;
    authorId: string;
  }): Promise<{
    success: boolean;
    solvedAt: Date | null;
    acceptedAnswerId: string | null;
  }> {
    if (!input.questionId || !input.answerCommentId || !input.authorId) {
      throw new Error("Missing required parameters for accepting solution");
    }

    const result = await this.qaRepo.acceptSolution({
      questionId: input.questionId,
      answerCommentId: input.answerCommentId,
      authorId: input.authorId,
    });

    return {
      success: true,
      solvedAt: result.post.solvedAt,
      acceptedAnswerId: result.post.acceptedAnswerId,
    };
  }
}

export class UnacceptSolutionUseCase {
  constructor(private qaRepo: IQARepository) {}

  async execute(input: {
    questionId: string;
    authorId: string;
  }): Promise<{
    success: boolean;
  }> {
    if (!input.questionId || !input.authorId) {
      throw new Error("Missing required parameters for unaccepting solution");
    }

    await this.qaRepo.unacceptSolution({
      questionId: input.questionId,
      authorId: input.authorId,
    });

    return {
      success: true,
    };
  }
}
