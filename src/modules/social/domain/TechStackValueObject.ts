export type SupportedTech =
  | "TypeScript"
  | "JavaScript"
  | "React"
  | "Next.js"
  | "Node.js"
  | "Express"
  | "PostgreSQL"
  | "Prisma"
  | "MongoDB"
  | "Redis"
  | "Docker"
  | "Kubernetes"
  | "Python"
  | "Go"
  | "Java"
  | "C#"
  | "Rust"
  | "PHP"
  | "TailwindCSS"
  | "GraphQL"
  | "AWS";

export const ALLOWED_TECHNOLOGIES: SupportedTech[] = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "PostgreSQL",
  "Prisma",
  "MongoDB",
  "Redis",
  "Docker",
  "Kubernetes",
  "Python",
  "Go",
  "Java",
  "C#",
  "Rust",
  "PHP",
  "TailwindCSS",
  "GraphQL",
  "AWS",
];

export class TechStackValueObject {
  public static parse(techData: any): string[] {
    if (!techData) return [];

    let arrayData: any[] = [];
    if (typeof techData === 'string') {
      try {
        arrayData = JSON.parse(techData);
      } catch {
        return [];
      }
    } else if (Array.isArray(techData)) {
      arrayData = techData;
    }

    if (!Array.isArray(arrayData)) return [];

    const result: string[] = [];
    const seen = new Set<string>();

    for (const item of arrayData) {
      if (typeof item !== 'string') continue;
      const trimmed = item.trim();
      if (!trimmed) continue;

      const normalizedKey = trimmed.toLowerCase();
      if (seen.has(normalizedKey)) continue;

      seen.add(normalizedKey);
      result.push(trimmed);
    }

    return result;
  }

  public static format(stack: string[]): string[] {
    return this.parse(stack);
  }
}
