import { PrismaClient } from "@prisma/client";
import { IProfileRepository } from "../domain/IProfileRepository";

export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfileByUsername(usernameOrId: string): Promise<any | null> {
    return await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: usernameOrId },
          { id: usernameOrId },
        ],
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
        techStack: true,
        developerLinks: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
      },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      username?: string;
      bio?: string;
      location?: string;
      website?: string;
      image?: string;
      avatarMediaId?: string;
      techStack?: any;
      developerLinks?: any;
    }
  ): Promise<any | null> {
    return await this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

}
