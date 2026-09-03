import { IAuthGateway } from "../domain/IAuthGateway";
import { AuthenticatedUser, UserRole } from "@/shared/kernel/auth.types";
import { getCurrentSession } from "@/lib/auth/server";
import { PrismaClient } from "@prisma/client";

export class BffAuthGateway implements IAuthGateway {
  constructor(private db: PrismaClient) {}

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const session = await getCurrentSession();

    if (!session.isAuthenticated || !session.user) return null;

    return {
      id: session.user.id,
      externalId: session.user.id,
      role: (session.user.role as UserRole) || 'USER',
      email: session.user.email,
    };
  }

  async getUserRole(userId: string): Promise<UserRole> {
    const session = await getCurrentSession();
    if (session.user && session.user.id === userId) {
      return (session.user.role as UserRole) || 'USER';
    }

    const dbUser = await this.db.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!dbUser) throw new Error("User not found");
    return dbUser.role as UserRole;
  }
}

