"use server" ;

import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";

import { 
    createVibeUseCase, 
    generateFeedUseCase, 
    deleteVibeUseCase,
    toggleLikeUseCase,
    toggleReGridUseCase,
    toggleBookmarkUseCase,
    addCommentUseCase,
    deleteCommentUseCase,
    getPostByIdUseCase,
    logger
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
        logger.error('failed to create a post!', er);
        return {success : false, error : 'failed to create a post!'}
    }
}

import { PostContentValueObject, SupportedLanguage } from "@/modules/vibe/domain/PostContentValueObject";

// 1.5 wrapper for react 19 form actions
export async function createPostFormAction(prevState: any, formData: FormData) {
    const rawContent = formData.get('content') as string || '';
    const codeSnippet = formData.get('codeSnippet') as string;
    const codeLanguage = (formData.get('codeLanguage') as string || 'typescript') as SupportedLanguage;

    const mediaUrl = formData.get('mediaUrl') as string || formData.get('imageUrl') as string;
    const rawMediaType = formData.get('mediaType') as string;
    const mediaType = rawMediaType ? (rawMediaType.toUpperCase() as any) : undefined;
    const tagsRaw = formData.get('tags') as string;
    const categoryId = formData.get('categoryId') as string;
    const vibeId = formData.get('vibeId') as string;

    const finalContent = PostContentValueObject.format(
        rawContent,
        codeSnippet?.trim() ? { language: codeLanguage, code: codeSnippet } : undefined
    );

    if (!finalContent?.trim() && !mediaUrl) {
        return { success: false, error: 'Post cannot be empty.' };
    }

    const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean) : undefined;

    try {
        const result = await creatPost(finalContent, mediaUrl, mediaType, tags, categoryId || undefined, vibeId || undefined);
        if (result?.success) {
            return { success: true };
        }
        return { success: false, error: 'Failed to drop vibe.' };
    } catch (err) {
        logger.error('Error in createPostFormAction', err);
        return { success: false, error: 'Something went wrong.' };
    }
}

//2//to get all posts
export async function getPosts(params: ExplorePostsCriteria = {}) {
    try {
        const userId = params.userId || (await getDbUserId()) || undefined;
        const result = await generateFeedUseCase.execute({ ...params, userId });
        return result; 
    } catch (er){
        logger.error('failed to fetch posts!', er);
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
        logger.error('failed to toggle like!', error, { postId });
        return {success : false, error : 'failed to toggle like!'}
    }
}

//3.5 to toggle Bookmarks on the post
export async function toggleBookmark(postId : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return { success: false, error: 'Unauthorized' };
        
        const result = await toggleBookmarkUseCase.execute(postId, userId);
        if (!result.success) {
            return {success : false, error : 'failed to toggle bookmark!'}
        }

        revalidatePath('/') ;
        return {success : true, isBookmarked: result.value.isBookmarked} ;
    } catch (error) {
        logger.error('failed to toggle bookmark!', error, { postId });
        return {success : false, error : 'failed to toggle bookmark!'}
    }
}

//3.6 to toggle ReGrid (Repost/Share) on the post
export async function toggleReGrid(postId : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return { success: false, error: 'Unauthorized' };
        
        const result = await toggleReGridUseCase.execute(postId, userId);
        if (!result.success) {
            return {success : false, error : 'failed to toggle regrid!'}
        }

        revalidatePath('/') ;
        return {success : true, isReGridded: result.value.isReGridded} ;
    } catch (error) {
        logger.error('failed to toggle regrid!', error, { postId });
        return {success : false, error : 'failed to toggle regrid!'}
    }
}

//4//to create a comment or reply
export async function createComment(postId : string, content : string, parentId?: string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return { success: false, error: 'Unauthorized' };
        if(!content) throw new Error('comment content is required!') ;
        
        const result = await addCommentUseCase.execute(postId, userId, content, parentId);
        if (!result.success) {
            return {success : false, error : 'failed to create a comment!'}
        }

        revalidatePath('/') ;
        return {success : true , comment: result.value.comment};
    }catch (error){
        logger.error('failed to create comment!', error, { postId });
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
        logger.error('failed to delete comment', error, { commentId });
        return {success: false, error: 'failed to delete comment'};
    }
}

export async function getPostById(postId: string) {
    try {
        const post = await getPostByIdUseCase.execute(postId);
        return post;
    } catch (error) {
        logger.error('failed to get post', error, { postId });
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
        logger.error('failed to delete a post!', er, { postId });
        return {success : false, error : er.message || 'failed to delete a post!'}
    }
}