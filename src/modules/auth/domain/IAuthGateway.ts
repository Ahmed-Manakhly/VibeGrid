import { AuthenticatedUser, UserRole } from "@/shared/kernel/auth.types";

export interface IAuthGateway {
  getCurrentUser(): Promise<AuthenticatedUser | null>;
  getUserRole(userId: string): Promise<UserRole>;
}
