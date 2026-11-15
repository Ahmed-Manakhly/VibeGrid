import {
  ListCommunitiesUseCase,
  GetCommunityBySlugUseCase,
  CreateCommunityUseCase,
  JoinCommunityUseCase,
  LeaveCommunityUseCase,
  GetCommunityFeedUseCase,
  GetCommunityMembersUseCase,
} from "../application/CommunityUseCases";
import { ICommunityRepository, CommunityEntity, CommunityMemberEntity } from "../domain/ICommunityRepository";
import { CommunityRole } from "@prisma/client";

describe("Community Use Cases Unit Tests", () => {
  let mockRepo: jest.Mocked<ICommunityRepository>;
  let listCommunitiesUseCase: ListCommunitiesUseCase;
  let getCommunityBySlugUseCase: GetCommunityBySlugUseCase;
  let createCommunityUseCase: CreateCommunityUseCase;
  let joinCommunityUseCase: JoinCommunityUseCase;
  let leaveCommunityUseCase: LeaveCommunityUseCase;
  let getCommunityFeedUseCase: GetCommunityFeedUseCase;
  let getCommunityMembersUseCase: GetCommunityMembersUseCase;

  const mockCommunity: CommunityEntity = {
    id: "comm-1",
    slug: "frontend-architects",
    name: "Frontend Architects",
    description: "High signal frontend architecture discussions",
    avatarUrl: null,
    bannerUrl: null,
    techTags: ["react", "nextjs", "typescript"],
    rules: ["Be respectful"],
    isPrivate: false,
    creatorId: "user-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { members: 10, posts: 25 },
    isMember: false,
    userRole: null,
  };

  const mockMember: CommunityMemberEntity = {
    id: "member-1",
    userId: "user-2",
    communityId: "comm-1",
    role: CommunityRole.MEMBER,
    joinedAt: new Date(),
  };

  beforeEach(() => {
    mockRepo = {
      findBySlug: jest.fn(),
      findById: jest.fn(),
      listCommunities: jest.fn(),
      createCommunity: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
      getMembership: jest.fn(),
      getCommunityMembers: jest.fn(),
      getCommunityFeed: jest.fn(),
      deleteCommunity: jest.fn(),
      getUserCommunities: jest.fn(),
    };

    listCommunitiesUseCase = new ListCommunitiesUseCase(mockRepo);
    getCommunityBySlugUseCase = new GetCommunityBySlugUseCase(mockRepo);
    createCommunityUseCase = new CreateCommunityUseCase(mockRepo);
    joinCommunityUseCase = new JoinCommunityUseCase(mockRepo);
    leaveCommunityUseCase = new LeaveCommunityUseCase(mockRepo);
    getCommunityFeedUseCase = new GetCommunityFeedUseCase(mockRepo);
    getCommunityMembersUseCase = new GetCommunityMembersUseCase(mockRepo);
  });

  describe("ListCommunitiesUseCase", () => {
    it("should return communities from repository", async () => {
      mockRepo.listCommunities.mockResolvedValue({ items: [mockCommunity] });

      const result = await listCommunitiesUseCase.execute({ tag: "react" });
      expect(mockRepo.listCommunities).toHaveBeenCalledWith({ tag: "react" });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].slug).toBe("frontend-architects");
    });
  });

  describe("GetCommunityBySlugUseCase", () => {
    it("should fetch community by slug", async () => {
      mockRepo.findBySlug.mockResolvedValue(mockCommunity);

      const result = await getCommunityBySlugUseCase.execute({ slug: "frontend-architects", viewerId: "user-1" });
      expect(mockRepo.findBySlug).toHaveBeenCalledWith("frontend-architects", "user-1");
      expect(result?.name).toBe("Frontend Architects");
    });

    it("should throw error if slug is missing", async () => {
      await expect(getCommunityBySlugUseCase.execute({ slug: "" })).rejects.toThrow("Community slug is required");
    });
  });

  describe("CreateCommunityUseCase", () => {
    it("should generate slug from name and add creator as ADMIN", async () => {
      mockRepo.findBySlug.mockResolvedValue(null);
      mockRepo.createCommunity.mockResolvedValue(mockCommunity);
      mockRepo.addMember.mockResolvedValue({ ...mockMember, role: CommunityRole.ADMIN });

      const result = await createCommunityUseCase.execute({
        name: "Frontend Architects",
        description: "Test description",
        creatorId: "user-1",
      });

      expect(mockRepo.findBySlug).toHaveBeenCalledWith("frontend-architects");
      expect(mockRepo.createCommunity).toHaveBeenCalled();
      expect(mockRepo.addMember).toHaveBeenCalledWith("comm-1", "user-1", CommunityRole.ADMIN);
      expect(result.id).toBe("comm-1");
    });

    it("should throw error if slug already exists", async () => {
      mockRepo.findBySlug.mockResolvedValue(mockCommunity);

      await expect(
        createCommunityUseCase.execute({
          name: "Frontend Architects",
          creatorId: "user-1",
        })
      ).rejects.toThrow("already exists");
    });
  });

  describe("JoinCommunityUseCase", () => {
    it("should add member with MEMBER role", async () => {
      mockRepo.addMember.mockResolvedValue(mockMember);

      const result = await joinCommunityUseCase.execute({
        communityId: "comm-1",
        userId: "user-2",
      });

      expect(mockRepo.addMember).toHaveBeenCalledWith("comm-1", "user-2", CommunityRole.MEMBER);
      expect(result.userId).toBe("user-2");
    });
  });

  describe("LeaveCommunityUseCase", () => {
    it("should remove member if not creator", async () => {
      mockRepo.findById.mockResolvedValue(mockCommunity);
      mockRepo.removeMember.mockResolvedValue();

      await leaveCommunityUseCase.execute({
        communityId: "comm-1",
        userId: "user-2",
      });

      expect(mockRepo.removeMember).toHaveBeenCalledWith("comm-1", "user-2");
    });

    it("should prevent creator from leaving without transferring ownership", async () => {
      mockRepo.findById.mockResolvedValue(mockCommunity);

      await expect(
        leaveCommunityUseCase.execute({
          communityId: "comm-1",
          userId: "user-1", // creator
        })
      ).rejects.toThrow("Community creator cannot leave");
    });
  });
});
