export interface Category {
  id: string;
  name: string;
  slug: string;
  emoji: string | null;
}

export interface Vibe {
  id: string;
  key: string;
  label: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: {
    posts: number;
  };
}

export interface ITaxonomyRepository {
  getCategories(): Promise<Category[]>;
  getVibes(): Promise<Vibe[]>;
  getTags(limit: number): Promise<Tag[]>;
  getTrendingTags(limit: number): Promise<any[]>; // Will refine type later
  createCategory(data: { name: string; slug: string; emoji?: string }): Promise<Category>;
  createVibe(data: { key: string; label: string }): Promise<Vibe>;
}
