export type UserRole = 'USER' | 'ADMIN';

export interface AuthenticatedUser {
  id: string;         // our Prisma DB id
  externalId: string; // clerkId now, JWT sub later
  role: UserRole;
  email: string;
}
