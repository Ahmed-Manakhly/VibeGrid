import { ShipTechContextValueObject } from "@/modules/vibe/domain/ShipTechContext";

describe("ShipTechContextValueObject", () => {
  it("should validate and normalize valid ship project metadata", () => {
    const raw = {
      isShip: true,
      projectName: "VibeGrid Platform",
      tagline: "Developer network and discovery launchpad",
      demoUrl: "https://vibegrid.tech",
      repoUrl: "https://github.com/Ahmed-Manakhly/VibeGrid",
      techStack: ["Next.js", "PostgreSQL", "Docker", "Redis"],
    };

    const validated = ShipTechContextValueObject.validate(raw);

    expect(validated).not.toBeNull();
    expect(validated?.isShip).toBe(true);
    expect(validated?.projectName).toBe("VibeGrid Platform");
    expect(validated?.demoUrl).toBe("https://vibegrid.tech");
    expect(validated?.repoUrl).toBe("https://github.com/Ahmed-Manakhly/VibeGrid");
    expect(validated?.techStack).toEqual(["next.js", "postgresql", "docker", "redis"]);
  });

  it("should return null if isShip is false or data is empty", () => {
    expect(ShipTechContextValueObject.validate(null)).toBeNull();
    expect(ShipTechContextValueObject.validate({ isShip: false })).toBeNull();
  });

  it("should throw error if project name is missing or blank", () => {
    expect(() =>
      ShipTechContextValueObject.validate({
        isShip: true,
        projectName: "   ",
      })
    ).toThrow("Project name is required for Ship projects");
  });

  it("should throw error if URLs do not start with http or https", () => {
    expect(() =>
      ShipTechContextValueObject.validate({
        isShip: true,
        projectName: "My Tool",
        demoUrl: "ftp://example.com",
      })
    ).toThrow("Live Demo URL must be a valid HTTP or HTTPS address");

    expect(() =>
      ShipTechContextValueObject.validate({
        isShip: true,
        projectName: "My Tool",
        repoUrl: "javascript:void(0)",
      })
    ).toThrow("Repository URL must be a valid HTTP or HTTPS address");
  });

  it("should cap tech stack pills at 10 items and lower-case them", () => {
    const manyTags = Array.from({ length: 15 }, (_, i) => `Tech${i}`);
    const validated = ShipTechContextValueObject.validate({
      isShip: true,
      projectName: "ScaleApp",
      techStack: manyTags,
    });

    expect(validated?.techStack.length).toBe(10);
    expect(validated?.techStack[0]).toBe("tech0");
  });
});
