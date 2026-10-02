import { execSync } from "child_process";
import { logger } from "@/shared/infrastructure/di-container";

export async function pushSchema() {
  logger.info("ℹ️ Schema push managed by deployment migrations");
  return true;
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
    logger.info("✅ Bootstrap completed successfully!");
  } catch (error) {
    logger.error("❌ Bootstrap failed", error);
  }
}

