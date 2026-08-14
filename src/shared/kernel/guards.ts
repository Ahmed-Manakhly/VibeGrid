import { UserRole } from "./auth.types";
import { authGateway } from "../infrastructure/di-container";

export async function requireAuth() {
  const user = await authGateway.getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function restrictTo(...roles: UserRole[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}
