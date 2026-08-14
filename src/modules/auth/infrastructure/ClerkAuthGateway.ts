import { IAuthGateway } from "../domain/IAuthGateway";
import { AuthenticatedUser, UserRole } from "@/shared/kernel/auth.types";
import { auth, currentUser } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

export class ClerkAuthGateway implements IAuthGateway {
  constructor(private db: PrismaClient) {}

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const { userId: clerkId } = await auth();
    const user = await currentUser();

    if (!clerkId || !user) return null;

    const dbUser = await this.db.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!dbUser) return null;

    return {
      id: dbUser.id,
      externalId: clerkId,
      role: dbUser.role as UserRole,
      email: user.emailAddresses[0]?.emailAddress || "",
    };
  }

  async getUserRole(userId: string): Promise<UserRole> {
    const dbUser = await this.db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!dbUser) throw new Error("User not found");
    return dbUser.role as UserRole;
  }
}
