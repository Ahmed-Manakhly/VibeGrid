import { Result } from "@/shared/kernel/Result";
import { ExplorePostsCriteria, ExplorePostsResult } from "./ExplorePostsCriteria";

export interface VibePost {
    id: string;
    content: string | null;
    image: string | null;
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
    comments: any[];
    _count: {
        likes: number;
        comments: number;
    };
    createdAt: Date;
}

export interface IVibeRepository {
    create(data: { content: string, imageUrl: string, authorId: string, categoryId?: string, vibeId?: string, tags?: string[] }, tx?: any): Promise<Result<any>>;
    getFeed(params?: ExplorePostsCriteria): Promise<ExplorePostsResult<VibePost>>;
    getPostById(postId: string): Promise<any | null>;
    deletePost(postId: string, userId: string, tx?: any): Promise<Result<void>>;
}
