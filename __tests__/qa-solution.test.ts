import { AcceptSolutionUseCase, UnacceptSolutionUseCase } from "@/modules/qa/application/AcceptSolution.usecase";
import { IQARepository } from "@/modules/qa/domain/IQARepository";

describe("QA Solution Use Cases", () => {
  let mockQaRepo: jest.Mocked<IQARepository>;
  let acceptSolutionUseCase: AcceptSolutionUseCase;
  let unacceptSolutionUseCase: UnacceptSolutionUseCase;

  beforeEach(() => {
    mockQaRepo = {
      acceptSolution: jest.fn(),
      unacceptSolution: jest.fn(),
    };
    acceptSolutionUseCase = new AcceptSolutionUseCase(mockQaRepo);
    unacceptSolutionUseCase = new UnacceptSolutionUseCase(mockQaRepo);
  });

  it("should successfully accept a solution comment for a question", async () => {
    const solvedAt = new Date();
    mockQaRepo.acceptSolution.mockResolvedValueOnce({
      post: {
        id: "post-1",
        solvedAt,
        acceptedAnswerId: "comment-1",
      },
      comment: {
        id: "comment-1",
        isSolution: true,
        authorId: "user-2",
      },
    });

    const result = await acceptSolutionUseCase.execute({
      questionId: "post-1",
      answerCommentId: "comment-1",
      authorId: "user-1",
    });

    expect(result.success).toBe(true);
    expect(result.acceptedAnswerId).toBe("comment-1");
    expect(result.solvedAt).toBe(solvedAt);
    expect(mockQaRepo.acceptSolution).toHaveBeenCalledWith({
      questionId: "post-1",
      answerCommentId: "comment-1",
      authorId: "user-1",
    });
  });

  it("should throw error if parameters are missing", async () => {
    await expect(
      acceptSolutionUseCase.execute({
        questionId: "",
        answerCommentId: "comment-1",
        authorId: "user-1",
      })
    ).rejects.toThrow("Missing required parameters for accepting solution");
  });

  it("should successfully unaccept a solution", async () => {
    mockQaRepo.unacceptSolution.mockResolvedValueOnce({
      post: {
        id: "post-1",
        solvedAt: null,
        acceptedAnswerId: null,
      },
    });

    const result = await unacceptSolutionUseCase.execute({
      questionId: "post-1",
      authorId: "user-1",
    });

    expect(result.success).toBe(true);
    expect(mockQaRepo.unacceptSolution).toHaveBeenCalledWith({
      questionId: "post-1",
      authorId: "user-1",
    });
  });
});
