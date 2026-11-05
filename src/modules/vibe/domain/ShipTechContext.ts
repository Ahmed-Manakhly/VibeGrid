export interface ShipTechContext {
  isShip: boolean;
  projectName: string;
  tagline?: string | null;
  demoUrl?: string | null;
  repoUrl?: string | null;
  techStack: string[];
}

export class ShipTechContextValueObject {
  static validate(data: unknown): ShipTechContext | null {
    if (!data || typeof data !== "object") return null;
    const obj = data as Record<string, unknown>;

    if (!obj.isShip) return null;

    if (typeof obj.projectName !== "string" || !obj.projectName.trim()) {
      throw new Error("Project name is required for Ship projects");
    }

    const demoUrl = typeof obj.demoUrl === "string" && obj.demoUrl.trim() ? obj.demoUrl.trim() : null;
    if (demoUrl && !demoUrl.startsWith("http://") && !demoUrl.startsWith("https://")) {
      throw new Error("Live Demo URL must be a valid HTTP or HTTPS address");
    }

    const repoUrl = typeof obj.repoUrl === "string" && obj.repoUrl.trim() ? obj.repoUrl.trim() : null;
    if (repoUrl && !repoUrl.startsWith("http://") && !repoUrl.startsWith("https://")) {
      throw new Error("Repository URL must be a valid HTTP or HTTPS address");
    }

    const techStack: string[] = Array.isArray(obj.techStack)
      ? obj.techStack
          .filter((t): t is string => typeof t === "string" && Boolean(t.trim()))
          .map((t) => t.trim().toLowerCase())
          .slice(0, 10)
      : [];

    return {
      isShip: true,
      projectName: obj.projectName.trim(),
      tagline: typeof obj.tagline === "string" && obj.tagline.trim() ? obj.tagline.trim() : null,
      demoUrl,
      repoUrl,
      techStack,
    };
  }
}
