import { Result } from "@/shared/kernel/Result";
import { ExplorePostsCriteria, ExplorePostsResult } from "./ExplorePostsCriteria";
import { MediaType } from "@prisma/client";

export interface VibePost {
    id: string;
    content: string | null;
    mediaUrl: string | null;
    mediaType: MediaType | null;
    tags: any[];
    author: {
        id: string;
        username: string | null;
        image: string | null;
        name: string | null;
    };
    category?: any;
    vibe?: any;
    likes: { userId: string }[];
    bookmarks?: { userId: string }[];
    regrids?: { userId: string }[];
    comments: any[];
    _count: {
        likes: number;
        comments: number;
        bookmarks?: number;
        regrids?: number;
    };
    createdAt: Date;
}

export interface IVibeRepository {
    create(data: { content: string, mediaUrl?: string, mediaType?: MediaType, authorId: string, categoryId?: string, vibeId?: string, tags?: string[], techContext?: any, postType?: any, poll?: { question: string; options: string[]; durationHours: number } }, tx?: any): Promise<Result<any>>;
    getFeed(params?: ExplorePostsCriteria): Promise<ExplorePostsResult<VibePost>>;
    getPostById(postId: string): Promise<any | null>;
    getPostsByIds(postIds: string[]): Promise<VibePost[]>;
    deletePost(postId: string, userId: string, tx?: any): Promise<Result<void>>;
    getTrendingShips(limit?: number): Promise<any[]>;
}
