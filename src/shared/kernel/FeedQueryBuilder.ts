import { FeedQueryParams, FeedResult } from "./FeedQueryParams";

export type FieldConfigType = "relation-array" | "relation-scalar" | "scalar";

export interface FeedQueryConfig {
  defaultLimit: number;
  defaultSort: any;
  searchFields: string[];
  fieldConfigs: Record<string, FieldConfigType>;
  defaultRelations: any;
  exactMatchFields?: string[];
}

export class FeedQueryBuilder<T> {
  private query: any;
  private limit: number;

  constructor(
    private modelDelegate: any,
    private params: FeedQueryParams,
    private config: FeedQueryConfig
  ) {
    this.limit = Math.min(Number(this.params.limit) || this.config.defaultLimit, 50);

    this.query = {
      where: { AND: [] },
      orderBy: this.config.defaultSort,
      take: this.limit + 1, // Fetch one extra to determine if there's a next page
      include: this.config.defaultRelations,
    };
  }

  private buildWhereObject(fieldPath: string, value: any): any {
    if (fieldPath === "tag") {
      return { tags: { some: { tag: { slug: value } } } };
    }
    if (fieldPath === "vibe") {
      return { vibe: { key: value } };
    }
    if (fieldPath === "category") {
      return { category: { slug: value } };
    }

    return { [fieldPath]: value };
  }

  private processSearch() {
    if (this.params.search && this.config.searchFields.length > 0) {
      const or = { OR: [] as any[] };
      for (const field of this.config.searchFields) {
        or.OR.push({ [field]: { contains: this.params.search, mode: "insensitive" } });
      }
      this.query.where.AND.push(or);
    }
    return this;
  }

  private processFilters() {
    const filters = {
      tag: this.params.tag,
      category: this.params.category,
      vibe: this.params.vibe,
    };

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        this.query.where.AND.push(this.buildWhereObject(key, value));
      }
    }

    if (this.params.authorId) {
      this.query.where.AND.push({ authorId: this.params.authorId });
    }

    if (this.params.likedByUserId) {
      this.query.where.AND.push({
        likes: {
          some: {
            userId: this.params.likedByUserId,
          },
        },
      });
    }

    return this;
  }

  private processCursor() {
    if (this.params.cursor) {
      this.query.cursor = { id: this.params.cursor };
      this.query.skip = 1; // Skip the cursor itself
    }
    return this;
  }

  public async execute(): Promise<FeedResult<T>> {
    this.processSearch().processFilters().processCursor();

    // If AND is empty, Prisma sometimes prefers undefined
    if (this.query.where.AND.length === 0) {
      delete this.query.where.AND;
    }

    const data = await this.modelDelegate.findMany(this.query);

    let nextCursor: string | null = null;
    if (data.length > this.limit) {
      const nextItem = data.pop(); // Remove the extra item
      nextCursor = nextItem.id;
    }

    return {
      data,
      nextCursor,
    };
  }
}
