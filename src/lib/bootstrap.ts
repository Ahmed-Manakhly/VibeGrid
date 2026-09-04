import { prisma } from "@/shared/infrastructure/prisma";
import { UserRole } from "@/shared/kernel/auth.types";
import { execSync } from "child_process";

export async function pushSchema() {
  if (process.env.NEXT_PHASE === "phase-production-build" || process.env.PRISMA_PUSH_IN_ENTRYPOINT === "1" || (process.env.NODE_ENV !== "production" && process.env.FORCE_DB_PUSH !== "1")) {
    console.log("Skipping schema push in bootstrap (disabled during build/dev for performance)");
    return true;
  }
  try {
    console.log("🔄 Pushing database schema from schema.prisma...");
    execSync("npx prisma db push --accept-data-loss", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env,
    });
    console.log("✅ Database schema created successfully!");
    return true;
  } catch (error) {
    console.error("❌ Schema push failed", error);
    throw error;
  }
}

export async function ensureAdminUser() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminUsername = process.env.ADMIN_USERNAME || "admin";

  if (!adminEmail) {
    console.warn("⚠️ ADMIN_EMAIL not set. Skipping admin user bootstrap.");
    return;
  }

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (existingAdmin) {
      console.log("Admin user already exists. Skipping creation.");
      return;
    }

    const adminUser = await prisma.user.create({
      data: {
        id: "system-admin-bot",
        email: adminEmail.toLowerCase(),
        username: adminUsername,
        name: "System Admin",
        role: "ADMIN",
      },
    });

    console.log(`✅ Admin user created successfully: ${adminUser.email}`);
  } catch (error: any) {
    if (error.code === "P2002") {
      console.log("Admin user already exists (created by another process).");
      return;
    }
    console.error("Failed to create admin user", error);
  }
}

const globalForBootstrap = globalThis as unknown as {
  __bootstrapRan: boolean | undefined;
};

export async function bootstrap() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (globalForBootstrap.__bootstrapRan) return;
  globalForBootstrap.__bootstrapRan = true;

  try {
    await pushSchema();
    await ensureAdminUser();
    console.log("✅ Bootstrap completed successfully!");
  } catch (error) {
    console.error("❌ Bootstrap failed", error);
  }
}
