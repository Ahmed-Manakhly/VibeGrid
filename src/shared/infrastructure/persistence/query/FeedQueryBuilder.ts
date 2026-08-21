export type FieldConfigType = "relation-array" | "relation-scalar" | "scalar" | ((value: any) => any);

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
    private params: Record<string, any>,
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

  private buildWhereObject(field: string, value: any): any {
    const config = this.config.fieldConfigs[field];
    if (!config) return { [field]: value };

    if (typeof config === "function") {
      return config(value);
    }
    if (config === "relation-array") {
      return { [field]: { some: { id: value } } };
    }
    if (config === "relation-scalar") {
      return { [field]: { slug: value } };
    }
    return { [field]: value };
  }

  private processSearch() {
    if (this.params.search && this.config.searchFields.length > 0) {
      const or = { OR: [] as any[] };
      for (const field of this.config.searchFields) {
        const parts = field.split(".");
        let currentObj: any = { contains: this.params.search, mode: "insensitive" };
        
        for (let i = parts.length - 1; i >= 0; i--) {
          const part = parts[i];
          if (this.config.fieldConfigs?.[part] === "relation-array") {
            currentObj = { [part]: { some: currentObj } };
          } else {
            currentObj = { [part]: currentObj };
          }
        }
        or.OR.push(currentObj);
      }
      this.query.where.AND.push(or);
    }
    return this;
  }

  private processFilters() {
    for (const key of Object.keys(this.config.fieldConfigs)) {
      const value = (this.params as any)[key];
      if (value !== undefined && value !== null) {
        this.query.where.AND.push(this.buildWhereObject(key, value));
      }
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

  public async execute(): Promise<{ data: T[]; nextCursor: string | null }> {
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
