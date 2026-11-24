import { CreateCategoryUseCase } from "../CreateCategory.usecase";
import { CreateVibeTaxonomyUseCase } from "../CreateVibeTaxonomy.usecase";
import { GetTaxonomyUseCase } from "../GetTaxonomy.usecase";
import { ITaxonomyRepository } from "../../domain/ITaxonomyRepository";
import { ICacheService } from "@/shared/application/ports/ICacheService";
import { RedisKeys } from "@/shared/infrastructure/cache/RedisKeys";

describe("Taxonomy Module Use Cases", () => {
  let mockRepo: jest.Mocked<ITaxonomyRepository>;
  let mockCache: jest.Mocked<ICacheService>;

  beforeEach(() => {
    mockRepo = {
      getCategories: jest.fn(),
      getVibes: jest.fn(),
      createCategory: jest.fn(),
      createVibe: jest.fn(),
      findCategoryBySlug: jest.fn(),
      findVibeByKey: jest.fn(),
    } as any;

    mockCache = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(true),
      delete: jest.fn().mockResolvedValue(true),
    } as any;
  });

  describe("CreateCategoryUseCase", () => {
    it("should create category and invalidate taxonomy cache", async () => {
      const categoryData = { name: "DevOps", slug: "devops", emoji: "🚀" };
      mockRepo.createCategory.mockResolvedValue({ id: "cat_1", ...categoryData });

      const useCase = new CreateCategoryUseCase(mockRepo, mockCache);
      const result = await useCase.execute(categoryData);

      expect(mockRepo.createCategory).toHaveBeenCalledWith(categoryData);
      expect(mockCache.delete).toHaveBeenCalledWith(RedisKeys.tagsAll());
      expect(result.id).toBe("cat_1");
    });
  });

  describe("CreateVibeTaxonomyUseCase", () => {
    it("should create vibe and invalidate taxonomy cache", async () => {
      const vibeData = { key: "debugging", label: "Debugging" };
      mockRepo.createVibe.mockResolvedValue({ id: "vibe_1", ...vibeData });

      const useCase = new CreateVibeTaxonomyUseCase(mockRepo, mockCache);
      const result = await useCase.execute(vibeData);

      expect(mockRepo.createVibe).toHaveBeenCalledWith(vibeData);
      expect(mockCache.delete).toHaveBeenCalledWith(RedisKeys.tagsAll());
      expect(result.id).toBe("vibe_1");
    });
  });

  describe("GetTaxonomyUseCase", () => {
    it("should return cached data if available and non-empty", async () => {
      const cachedData = {
        categories: [{ id: "cat_1", name: "Backend", slug: "backend" }],
        vibes: [{ id: "vibe_1", key: "shipped", label: "Shipped" }],
      };
      mockCache.get.mockResolvedValue(cachedData);

      const useCase = new GetTaxonomyUseCase(mockRepo, mockCache);
      const result = await useCase.execute();

      expect(result).toEqual(cachedData);
      expect(mockRepo.getCategories).not.toHaveBeenCalled();
      expect(mockRepo.getVibes).not.toHaveBeenCalled();
    });

    it("should query repository and cache result if cache is empty", async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.getCategories.mockResolvedValue([{ id: "cat_1", name: "AI", slug: "ai" }] as any);
      mockRepo.getVibes.mockResolvedValue([{ id: "vibe_1", key: "learning", label: "Learning" }] as any);

      const useCase = new GetTaxonomyUseCase(mockRepo, mockCache);
      const result = await useCase.execute();

      expect(result.categories).toHaveLength(1);
      expect(result.vibes).toHaveLength(1);
      expect(mockCache.set).toHaveBeenCalledWith(
        RedisKeys.tagsAll(),
        {
          categories: [{ id: "cat_1", name: "AI", slug: "ai" }],
          vibes: [{ id: "vibe_1", key: "learning", label: "Learning" }],
        },
        expect.any(Number)
      );
    });

    it("should not cache empty result to prevent negative caching locks", async () => {
      mockCache.get.mockResolvedValue(null);
      mockRepo.getCategories.mockResolvedValue([]);
      mockRepo.getVibes.mockResolvedValue([]);

      const useCase = new GetTaxonomyUseCase(mockRepo, mockCache);
      const result = await useCase.execute();

      expect(result.categories).toEqual([]);
      expect(result.vibes).toEqual([]);
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });
});
