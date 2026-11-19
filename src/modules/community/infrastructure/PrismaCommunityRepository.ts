import { PrismaClient, CommunityRole } from "@prisma/client";
import {
  ICommunityRepository,
  CreateCommunityDTO,
  ListCommunitiesParams,
  CommunityEntity,
  CommunityMemberEntity,
} from "../domain/ICommunityRepository";

export class PrismaCommunityRepository implements ICommunityRepository {
  constructor(private prisma: PrismaClient) {}

  private mapCommunity(raw: any, viewerId?: string): CommunityEntity {
    const isMember = viewerId && raw.members ? raw.members.length > 0 : false;
    const userRole = viewerId && raw.members && raw.members.length > 0 ? (raw.members[0].role as CommunityRole) : null;

    return {
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      avatarUrl: raw.avatarUrl,
      bannerUrl: raw.bannerUrl,
      techTags: Array.isArray(raw.techTags) ? (raw.techTags as string[]) : [],
      rules: Array.isArray(raw.rules) ? (raw.rules as string[]) : [],
      isPrivate: raw.isPrivate,
      creatorId: raw.creatorId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      _count: raw._count
        ? {
            members: raw._count.members || 0,
            posts: raw._count.posts || 0,
          }
        : undefined,
      isMember,
      userRole,
    };
  }

  async findBySlug(slug: string, viewerId?: string): Promise<CommunityEntity | null> {
    const community = await (this.prisma as any).community.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
        members: viewerId
          ? {
              where: { userId: viewerId },
              select: { role: true },
            }
          : false,
      },
    });

    if (!community) return null;
    return this.mapCommunity(community, viewerId);
  }

  async findById(id: string, viewerId?: string): Promise<CommunityEntity | null> {
    const community = await (this.prisma as any).community.findUnique({
      where: { id },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
        members: viewerId
          ? {
              where: { userId: viewerId },
              select: { role: true },
            }
          : false,
      },
    });

    if (!community) return null;
    return this.mapCommunity(community, viewerId);
  }

  async listCommunities(params: ListCommunitiesParams): Promise<{ items: CommunityEntity[]; nextCursor?: string }> {
    const limit = params.limit || 20;
    const where: any = {};

    if (params.search && params.search.trim()) {
      where.OR = [
        { name: { contains: params.search.trim(), mode: "insensitive" } },
        { description: { contains: params.search.trim(), mode: "insensitive" } },
        { slug: { contains: params.search.trim(), mode: "insensitive" } },
      ];
    }

    if (params.excludeCreatorIds && params.excludeCreatorIds.length > 0) {
      where.creatorId = { notIn: params.excludeCreatorIds };
    }

    const items = await (this.prisma as any).community.findMany({
      where,
      take: limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
        members: params.viewerId
          ? {
              where: { userId: params.viewerId },
              select: { role: true },
            }
          : false,
      },
    });

    let nextCursor: string | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem.id;
    }

    let mapped = items.map((c: any) => this.mapCommunity(c, params.viewerId));

    if (params.tag && params.tag.trim() && params.tag !== "all") {
      const targetTag = params.tag.trim().toLowerCase().replace(/^#/, "");
      mapped = mapped.filter((c: CommunityEntity) =>
        c.techTags.some((t) => t.toLowerCase().replace(/^#/, "") === targetTag)
      );
    }

    return { items: mapped, nextCursor };
  }

  async createCommunity(data: CreateCommunityDTO): Promise<CommunityEntity> {
    const created = await (this.prisma as any).community.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        avatarUrl: data.avatarUrl,
        bannerUrl: data.bannerUrl,
        techTags: data.techTags || [],
        rules: data.rules || [],
        isPrivate: data.isPrivate ?? false,
        creatorId: data.creatorId,
      },
      include: {
        _count: {
          select: { members: true, posts: true },
        },
      },
    });

    return this.mapCommunity(created, data.creatorId);
  }

  async updateCommunity(data: import("../domain/ICommunityRepository").UpdateCommunityDTO): Promise<CommunityEntity> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
    if (data.techTags !== undefined) updateData.techTags = data.techTags;
    if (data.rules !== undefined) updateData.rules = data.rules;
    if (data.isPrivate !== undefined) updateData.isPrivate = data.isPrivate;

    const updated = await (this.prisma as any).community.update({
      where: { id: data.communityId },
      data: updateData,
      include: {
        _count: { select: { members: true, posts: true } },
      },
    });

    return this.mapCommunity(updated);
  }

  async updateMemberRole(communityId: string, targetUserId: string, role: CommunityRole): Promise<void> {
    await (this.prisma as any).communityMember.update({
      where: {
        userId_communityId: {
          userId: targetUserId,
          communityId,
        },
      },
      data: { role },
    });
  }

  async addMember(communityId: string, userId: string, role: CommunityRole = CommunityRole.MEMBER): Promise<CommunityMemberEntity> {
    const member = await (this.prisma as any).communityMember.upsert({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      update: {
        role,
      },
      create: {
        userId,
        communityId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return {
      id: member.id,
      userId: member.userId,
      communityId: member.communityId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    };
  }

  async removeMember(communityId: string, userId: string): Promise<void> {
    await (this.prisma as any).communityMember.deleteMany({
      where: {
        communityId,
        userId,
      },
    });
  }

  async getMembership(communityId: string, userId: string): Promise<CommunityMemberEntity | null> {
    const member = await (this.prisma as any).communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    if (!member) return null;
    return {
      id: member.id,
      userId: member.userId,
      communityId: member.communityId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: member.user,
    };
  }

  async getCommunityMembers(communityId: string, limit: number = 20): Promise<CommunityMemberEntity[]> {
    const members = await (this.prisma as any).communityMember.findMany({
      where: { communityId },
      take: limit,
      orderBy: { joinedAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return members.map((m: any) => ({
      id: m.id,
      userId: m.userId,
      communityId: m.communityId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    }));
  }

  async getCommunityFeed(communityId: string, params: { limit?: number; cursor?: string; viewerId?: string }): Promise<{ posts: any[]; nextCursor?: string }> {
    const limit = params.limit || 20;

    const posts = await (this.prisma as any).post.findMany({
      where: { communityId },
      take: limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            avatarUrl: true,
            members: {
              select: { userId: true },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            regrids: true,
            bookmarks: true,
          },
        },
        regrids: {
          select: {
            userId: true,
            createdAt: true,
            user: { select: { id: true, name: true, username: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        poll: {
          include: {
            options: true,
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (posts.length > limit) {
      const nextPost = posts.pop();
      nextCursor = nextPost.id;
    }

    if (params.viewerId && posts.length > 0) {
      const authorIds = Array.from(new Set(posts.map((p: any) => p.author?.id).filter(Boolean)));
      if (authorIds.length > 0) {
        const follows = await (this.prisma as any).follows.findMany({
          where: {
            followerId: params.viewerId,
            followingId: { in: authorIds },
          },
          select: { followingId: true },
        });
        const followedSet = new Set(follows.map((f: any) => f.followingId));
        for (const post of posts) {
          if (post.author) {
            post.author.isFollowing = followedSet.has(post.author.id);
          }
        }
      }
    }

    return { posts, nextCursor };
  }

  async deleteCommunity(communityId: string, userId: string): Promise<void> {
    const community = await (this.prisma as any).community.findUnique({
      where: { id: communityId },
      select: { creatorId: true },
    });

    if (!community) {
      throw new Error("Community not found");
    }

    if (community.creatorId !== userId) {
      throw new Error("Unauthorized: Only the community creator can delete this guild");
    }

    await (this.prisma as any).community.delete({
      where: { id: communityId },
    });
  }

  async getUserCommunities(userId: string): Promise<CommunityEntity[]> {
    const memberships = await (this.prisma as any).communityMember.findMany({
      where: { userId },
      include: {
        community: {
          include: {
            _count: {
              select: { members: true, posts: true },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return memberships.map((m: any) => ({
      ...this.mapCommunity(m.community, userId),
      isMember: true,
      userRole: m.role as CommunityRole,
    }));
  }
}
