import { IAuthRepository } from '@/modules/auth/domain/IAuthRepository';
import { prisma } from '@/shared/infrastructure/prisma';

export class ProfileBootstrapService {
  /**
   * Sanitizes and generates a unique username from an email or name
   */
  public static generateUsernameCandidate(email: string, name?: string): string {
    let base = (name || email.split('@')[0])
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    // Force the 'user_' prefix so the middleware triggers the onboarding flow
    base = `user_${base || email.split('@')[0].replace(/[^a-z0-9_]/g, '')}`;

    if (base.length > 20) {
      base = base.substring(0, 20);
    }

    return base;
  }

  /**
   * Ensures username uniqueness in PostgreSQL DB by appending numerical suffix if colliding
   */
  public static async resolveUniqueUsername(db: any, candidate: string, userId: string): Promise<string> {
    let username = candidate;
    let counter = 1;

    while (true) {
      const existing = await db.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
        select: { id: true },
      });

      if (!existing) {
        return username;
      }

      username = `${candidate.substring(0, 15)}_${counter}`;
      counter++;
    }
  }

  /**
   * Idempotently bootstraps a native VibeGrid User/Profile record
   */
  public static async bootstrapProfile(
    user: { id: string; email: string; name?: string; role?: string; avatarUrl?: string; isPolicyAccepted?: boolean },
    authRepo?: IAuthRepository
  ): Promise<any> {
    const userId = user.id;
    const email = user.email.toLowerCase();
    const displayName = user.name || email.split('@')[0];
    const isPolicyAccepted = Boolean(user.isPolicyAccepted);

    if (authRepo) {
      const existingUser = await authRepo.getUserById(userId);
      if (existingUser) return existingUser;
    } else {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userId },
            { email },
          ],
        },
      });

      if (existingUser) {
        // If Auth service ID changed (e.g. after Auth DB wipe/reseed), sync the ID in PostgreSQL
        if (existingUser.id !== userId) {
          try {
            await prisma.$executeRawUnsafe(
              `UPDATE "User" SET id = $1, role = $2 WHERE email = $3`,
              userId,
              (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'ADMIN' : existingUser.role,
              email
            );
            existingUser.id = userId;
          } catch (e) {
            // Ignore if foreign key constraints defer the update
          }
        }

        if (isPolicyAccepted && !existingUser.isPolicyAccepted) {
          return await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              isPolicyAccepted: true,
              policyAcceptedAt: new Date(),
            },
          });
        }
        return existingUser;
      }
    }

    const candidateUsername = this.generateUsernameCandidate(email, user.name);
    const uniqueUsername = await this.resolveUniqueUsername(prisma, candidateUsername, userId);

    if (authRepo) {
      return await authRepo.createUser({
        id: userId,
        email,
        name: displayName,
        username: uniqueUsername,
        image: user.avatarUrl || '',
      });
    }

    return await prisma.user.create({
      data: {
        id: userId,
        email,
        name: displayName,
        username: uniqueUsername,
        image: user.avatarUrl || null,
        role: (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ? 'ADMIN' : 'USER',
        isPolicyAccepted,
        policyAcceptedAt: isPolicyAccepted ? new Date() : null,
      },
    });
  }
}
