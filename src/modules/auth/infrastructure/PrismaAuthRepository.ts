import { IAuthRepository, SyncUserDTO } from "../domain/IAuthRepository";
import { PrismaClient } from "@prisma/client";

export class PrismaAuthRepository implements IAuthRepository {
  constructor(private db: PrismaClient) {}

  async getUserByClerkId(clerkId: string): Promise<any> {
    return this.db.user.findUnique({
      where: { clerkId },
      include: {
        _count: {
          select: { followers: true, following: true, posts: true },
        },
      },
    });
  }

  async createUser(data: SyncUserDTO): Promise<any> {
    return this.db.user.create({
      data: {
        clerkId: data.clerkId,
        name: data.name,
        username: data.username,
        email: data.email,
        image: data.image,
      },
    });
  }
}
