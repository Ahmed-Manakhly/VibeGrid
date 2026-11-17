import { CommunityRole } from "@prisma/client";

export interface CommunityEntity {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  techTags: string[];
  rules: string[];
  isPrivate: boolean;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
    posts: number;
  };
  isMember?: boolean;
  userRole?: CommunityRole | null;
}

export interface CommunityMemberEntity {
  id: string;
  userId: string;
  communityId: string;
  role: CommunityRole;
  joinedAt: Date;
  user?: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
  };
}

export interface CreateCommunityDTO {
  name: string;
  slug: string;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  techTags?: string[];
  rules?: string[];
  isPrivate?: boolean;
  creatorId: string;
}

export interface ListCommunitiesParams {
  tag?: string;
  search?: string;
  limit?: number;
  cursor?: string;
  viewerId?: string;
  excludeCreatorIds?: string[];
}

export interface UpdateCommunityDTO {
  communityId: string;
  name?: string;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  techTags?: string[];
  rules?: string[];
  isPrivate?: boolean;
}

export interface ICommunityRepository {
  findBySlug(slug: string, viewerId?: string): Promise<CommunityEntity | null>;
  findById(id: string, viewerId?: string): Promise<CommunityEntity | null>;
  listCommunities(params: ListCommunitiesParams): Promise<{ items: CommunityEntity[]; nextCursor?: string }>;
  createCommunity(data: CreateCommunityDTO): Promise<CommunityEntity>;
  updateCommunity(data: UpdateCommunityDTO): Promise<CommunityEntity>;
  addMember(communityId: string, userId: string, role?: CommunityRole): Promise<CommunityMemberEntity>;
  removeMember(communityId: string, userId: string): Promise<void>;
  updateMemberRole(communityId: string, targetUserId: string, role: CommunityRole): Promise<void>;
  getMembership(communityId: string, userId: string): Promise<CommunityMemberEntity | null>;
  getCommunityMembers(communityId: string, limit?: number): Promise<CommunityMemberEntity[]>;
  getCommunityFeed(communityId: string, params: { limit?: number; cursor?: string; viewerId?: string }): Promise<{ posts: any[]; nextCursor?: string }>;
  deleteCommunity(communityId: string, userId: string): Promise<void>;
  getUserCommunities(userId: string): Promise<CommunityEntity[]>;
}
