import { PrismaClient } from "@prisma/client";
import { IProfileRepository } from "../domain/IProfileRepository";

export class PrismaProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfileByUsername(username: string): Promise<any | null> {
    return await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        location: true,
        website: true,
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

  async updateProfile(clerkId: string, data: { name: string; bio: string; location: string; website: string; }): Promise<any | null> {
    return await this.prisma.user.update({
      where: { id: clerkId },
      data,
    });
  }

}
