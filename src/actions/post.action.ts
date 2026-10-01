"use server" ;

import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { error } from "console";



import { 
    createVibeUseCase, 
    generateFeedUseCase, 
    deleteVibeUseCase,
    toggleLikeUseCase,
    addCommentUseCase,
    deleteCommentUseCase,
    getPostByIdUseCase
} from "@/shared/infrastructure/di-container";
import { ExplorePostsCriteria } from "@/modules/vibe/domain/ExplorePostsCriteria";

//1//to create the post
export async function creatPost(content: string, mediaUrl?: string, mediaType?: any, tags?: string[], categoryId?: string, vibeId?: string) {
    try {
        const userId = await getDbUserId() ;
        if(!userId) return ; 
        
        const result = await createVibeUseCase.execute(content, mediaUrl, mediaType, userId, tags, undefined, categoryId, vibeId);
        
        if (!result.success) {
            return {success: false, error: 'failed to create a post!'}
        }

        revalidatePath('/') ; 
        return {success : true , post: result.value} ; 
    }catch (er){
        console.error('failed to create a post!' , er)
        return {success : false, error : 'failed to create a post!'}
    }
}

// 1.5 wrapper for react 19 form actions
export async function createPostFormAction(prevState: any, formData: FormData) {
    const content = formData.get('content') as string;
    const mediaUrl = formData.get('mediaUrl') as string || formData.get('imageUrl') as string;
    const rawMediaType = formData.get('mediaType') as string;
    const mediaType = rawMediaType ? (rawMediaType.toUpperCase() as any) : undefined;
    const tagsRaw = formData.get('tags') as string;
    const categoryId = formData.get('categoryId') as string;
    const vibeId = formData.get('vibeId') as string;

    if (!content?.trim() && !mediaUrl) {
        return { success: false, error: 'Post cannot be empty.' };
    }

    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : undefined;

    try {
        const result = await creatPost(content, mediaUrl, mediaType, tags, categoryId || undefined, vibeId || undefined);
        if (result?.success) {
            return { success: true };
        }
        return { success: false, error: 'Failed to drop vibe.' };
    } catch (err) {
        return { success: false, error: 'Something went wrong.' };
    }
}

//2//to get all posts
export async function getPosts(params: ExplorePostsCriteria = {}) {
    try {
        const result = await generateFeedUseCase.execute(params);
        return result; 
    } catch (er){
        console.error('failed to fetch posts!' , er);
        return { data: [], nextCursor: null };
    }
}
//3// to toggle Likes on the post
export async function toggleLike(postId : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return;
        
        const result = await toggleLikeUseCase.execute(postId, userId);
        if (!result.success) {
            return {success : false, error : 'failed to toggle like!'}
        }

        revalidatePath('/') ;
        return {success : true} ;
    } catch (error) {
        console.error('failed to toggle like!', error)
        return {success : false, error : 'failed to toggle like!'}
    }
}

//4//to create a comment
export async function createComment(postId : string, content : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return ;
        if(!content) throw new Error('comment content is required!') ;
        
        const result = await addCommentUseCase.execute(postId, userId, content);
        if (!result.success) {
            return {success : false, error : 'failed to create a comment!'}
        }

        revalidatePath('/') ;
        return {success : true , comment: result.value.comment};
    }catch (error){
        console.error('failed to create comment!', error)
        return {success : false, error : 'failed to create a comment!'}
    }
}

//4.5 to delete a comment
export async function deleteComment(commentId: string) {
    try {
        const userId = await getDbUserId();
        if(!userId) return;
        
        const result = await deleteCommentUseCase.execute(commentId, userId);
        if (!result.success) {
            return {success: false, error: 'failed to delete comment'};
        }
        
        revalidatePath('/');
        return {success: true};
    } catch (error) {
        console.error('failed to delete comment', error);
        return {success: false, error: 'failed to delete comment'};
    }
}

export async function getPostById(postId: string) {
    try {
        const post = await getPostByIdUseCase.execute(postId);
        return post;
    } catch (error) {
        console.error('failed to get post', error);
        return null;
    }
}

//5//to delete the post
export async function deletePost(postId : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return ;
        
        const result = await deleteVibeUseCase.execute(postId, userId);
        if (!result.success) {
             throw new Error(result.error.message);
        }

        revalidatePath('/') ; // purge the cash
        return {success : true} ;
    }catch (er: any){
        console.error('failed to delete a post!', er)
        return {success : false, error : er.message || 'failed to delete a post!'}
    }
}