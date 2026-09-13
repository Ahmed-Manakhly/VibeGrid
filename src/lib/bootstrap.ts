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

const globalForBootstrap = globalThis as unknown as {
  __bootstrapRan: boolean | undefined;
};

export async function bootstrap() {
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.BUILDING_NEXT === "1" ||
    process.argv.some((arg) => arg.includes("build"))
  ) {
    return;
  }
  if (globalForBootstrap.__bootstrapRan) return;
  globalForBootstrap.__bootstrapRan = true;

  try {
    await pushSchema();
    console.log("✅ Bootstrap completed successfully!");
  } catch (error) {
    console.error("❌ Bootstrap failed", error);
  }
}
