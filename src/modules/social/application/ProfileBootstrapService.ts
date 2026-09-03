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

    if (!base || base.length < 3) {
      base = `user_${email.split('@')[0].replace(/[^a-z0-9_]/g, '')}`;
    }

    if (base.length > 20) {
      base = base.substring(0, 20);
    }

    return base;
  }

  /**
   * Ensures username uniqueness in PostgreSQL DB by appending numerical suffix if colliding
   */
  public static async resolveUniqueUsername(prisma: any, candidate: string, userId: string): Promise<string> {
    let username = candidate;
    let counter = 1;

    while (true) {
      const existing = await prisma.user.findFirst({
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
  public static async bootstrapProfile(user: { id: string; email: string; name?: string; role?: string }): Promise<any> {
    const { prisma } = await import('@/shared/infrastructure/prisma');
    const userId = user.id;
    const email = user.email.toLowerCase();
    const displayName = user.name || email.split('@')[0];

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      // Idempotent: preserve existing customized profile fields (bio, location, website, name, username)
      return existingUser;
    }

    const candidateUsername = this.generateUsernameCandidate(email, user.name);
    const uniqueUsername = await this.resolveUniqueUsername(prisma, candidateUsername, userId);

    return await prisma.user.create({
      data: {
        id: userId,
        email,
        name: displayName,
        username: uniqueUsername,
        role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
    });
  }
}
