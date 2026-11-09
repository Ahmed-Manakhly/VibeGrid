import { CommunityRole } from "@prisma/client";
import {
  ICommunityRepository,
  CreateCommunityDTO,
  ListCommunitiesParams,
  CommunityEntity,
  CommunityMemberEntity,
} from "../domain/ICommunityRepository";

export class ListCommunitiesUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(params: ListCommunitiesParams = {}): Promise<{ items: CommunityEntity[]; nextCursor?: string }> {
    return await this.communityRepo.listCommunities(params);
  }
}

export class GetCommunityBySlugUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: { slug: string; viewerId?: string }): Promise<CommunityEntity | null> {
    if (!input.slug) {
      throw new Error("Community slug is required");
    }
    return await this.communityRepo.findBySlug(input.slug, input.viewerId);
  }
}

export class CreateCommunityUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: {
    name: string;
    slug?: string;
    description?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    techTags?: string[];
    rules?: string[];
    isPrivate?: boolean;
    creatorId: string;
  }): Promise<CommunityEntity> {
    if (!input.name || !input.name.trim()) {
      throw new Error("Community name is required");
    }
    if (!input.creatorId) {
      throw new Error("Creator ID is required");
    }

    const generatedSlug = (input.slug && input.slug.trim().length > 0)
      ? input.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-")
      : input.name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");

    const existing = await this.communityRepo.findBySlug(generatedSlug);
    if (existing) {
      throw new Error(`A community with slug '${generatedSlug}' already exists`);
    }

    const dto: CreateCommunityDTO = {
      name: input.name.trim(),
      slug: generatedSlug,
      description: input.description?.trim() || null,
      avatarUrl: input.avatarUrl || null,
      bannerUrl: input.bannerUrl || null,
      techTags: input.techTags || [],
      rules: input.rules || [],
      isPrivate: input.isPrivate ?? false,
      creatorId: input.creatorId,
    };

    const community = await this.communityRepo.createCommunity(dto);
    // Creator automatically becomes ADMIN member
    await this.communityRepo.addMember(community.id, input.creatorId, CommunityRole.ADMIN);

    return community;
  }
}

export class JoinCommunityUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: { communityId: string; userId: string }): Promise<CommunityMemberEntity> {
    if (!input.communityId || !input.userId) {
      throw new Error("Missing communityId or userId to join community");
    }
    return await this.communityRepo.addMember(input.communityId, input.userId, CommunityRole.MEMBER);
  }
}

export class LeaveCommunityUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: { communityId: string; userId: string }): Promise<void> {
    if (!input.communityId || !input.userId) {
      throw new Error("Missing communityId or userId to leave community");
    }
    const community = await this.communityRepo.findById(input.communityId);
    if (community && community.creatorId === input.userId) {
      throw new Error("Community creator cannot leave their own community without transferring ownership");
    }
    await this.communityRepo.removeMember(input.communityId, input.userId);
  }
}

export class GetCommunityFeedUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: { communityId: string; limit?: number; cursor?: string; viewerId?: string }): Promise<{ posts: any[]; nextCursor?: string }> {
    if (!input.communityId) {
      throw new Error("communityId is required to fetch community feed");
    }
    return await this.communityRepo.getCommunityFeed(input.communityId, input);
  }
}

export class GetCommunityMembersUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: { communityId: string; limit?: number }): Promise<CommunityMemberEntity[]> {
    if (!input.communityId) {
      throw new Error("communityId is required to fetch community members");
    }
    return await this.communityRepo.getCommunityMembers(input.communityId, input.limit);
  }
}
