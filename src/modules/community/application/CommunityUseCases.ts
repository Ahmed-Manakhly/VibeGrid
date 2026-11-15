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

export class UpdateCommunityUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: {
    communityId: string;
    userId: string;
    name?: string;
    description?: string | null;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    techTags?: string[];
    rules?: string[];
    isPrivate?: boolean;
  }): Promise<CommunityEntity> {
    const community = await this.communityRepo.findById(input.communityId, input.userId);
    if (!community) {
      throw new Error("Community not found");
    }

    const isCreator = community.creatorId === input.userId;
    const isAdmin = community.userRole === "ADMIN";
    if (!isCreator && !isAdmin) {
      throw new Error("Unauthorized: Only Guild Admins or the Creator can edit settings");
    }

    return await this.communityRepo.updateCommunity(input);
  }
}

export class UpdateMemberRoleUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: {
    communityId: string;
    actorUserId: string;
    targetUserId: string;
    newRole: CommunityRole;
  }): Promise<void> {
    const community = await this.communityRepo.findById(input.communityId, input.actorUserId);
    if (!community) {
      throw new Error("Community not found");
    }

    const isCreator = community.creatorId === input.actorUserId;
    const isAdmin = community.userRole === "ADMIN";
    if (!isCreator && !isAdmin) {
      throw new Error("Unauthorized: Only Guild Admins or the Creator can manage roles");
    }

    if (input.targetUserId === community.creatorId) {
      throw new Error("Cannot alter the Creator's ownership role");
    }

    await this.communityRepo.updateMemberRole(input.communityId, input.targetUserId, input.newRole);
  }
}

export class RemoveMemberUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: {
    communityId: string;
    actorUserId: string;
    targetUserId: string;
  }): Promise<void> {
    const community = await this.communityRepo.findById(input.communityId, input.actorUserId);
    if (!community) {
      throw new Error("Community not found");
    }

    const isCreator = community.creatorId === input.actorUserId;
    const isAdmin = community.userRole === "ADMIN";
    if (!isCreator && !isAdmin) {
      throw new Error("Unauthorized: Only Guild Admins or the Creator can remove members");
    }

    if (input.targetUserId === community.creatorId) {
      throw new Error("Cannot remove the Community Creator");
    }

    await this.communityRepo.removeMember(input.communityId, input.targetUserId);
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
  constructor(
    private communityRepo: ICommunityRepository,
    private eventBus?: any
  ) {}

  async execute(input: { communityId: string; userId: string }): Promise<CommunityMemberEntity> {
    if (!input.communityId || !input.userId) {
      throw new Error("Missing communityId or userId to join community");
    }
    const member = await this.communityRepo.addMember(input.communityId, input.userId, CommunityRole.MEMBER);

    // Notify community owner if eventBus available
    if (this.eventBus) {
      try {
        const community = await this.communityRepo.findById(input.communityId);
        if (community && community.creatorId && community.creatorId !== input.userId) {
          await this.eventBus.publish("CommunityJoinedEvent", {
            communityId: community.id,
            communityName: community.name,
            communitySlug: community.slug,
            targetUserId: community.creatorId,
            joinerId: input.userId,
            timestamp: new Date(),
          });
        }
      } catch {
        // Non-blocking
      }
    }

    return member;
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

export class DeleteCommunityUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(input: { communityId: string; userId: string }): Promise<void> {
    if (!input.communityId || !input.userId) {
      throw new Error("communityId and userId are required to delete a community");
    }
    await this.communityRepo.deleteCommunity(input.communityId, input.userId);
  }
}

export class GetUserCommunitiesUseCase {
  constructor(private communityRepo: ICommunityRepository) {}

  async execute(userId: string): Promise<CommunityEntity[]> {
    if (!userId) return [];
    return await this.communityRepo.getUserCommunities(userId);
  }
}
