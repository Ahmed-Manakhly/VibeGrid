import { execSync } from "child_process";

export async function pushSchema() {
  console.log("ℹ️ Schema push managed by deployment migrations");
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
    console.log("✅ Bootstrap completed successfully!");
  } catch (error) {
    console.error("❌ Bootstrap failed", error);
  }
}
