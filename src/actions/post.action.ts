"use server" ;

import { prisma } from "@/shared/infrastructure/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { error } from "console";



import { 
    createVibeUseCase, 
    generateFeedUseCase, 
    deleteVibeUseCase,
    toggleLikeUseCase,
    addCommentUseCase
} from "@/shared/infrastructure/di-container";

//1//to create the post
export async function creatPost(content: string, imageUrl: string, tags?: string[], mood?: string) {
    try {
        const userId = await getDbUserId() ;
        if(!userId) return ; 
        
        const result = await createVibeUseCase.execute(content, imageUrl, userId, tags, mood);
        
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
//2//to get all posts
export async function getPosts(){
    try {
        const posts = await generateFeedUseCase.execute();
        revalidatePath('/') ; 
        return posts ; 
    }catch (er){
        console.error('failed to fetch posts!' , er)
        throw new Error('failed to fetch posts!') 
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
        return {success : true , comment: result.value.comment} ;
    }catch (er){
        console.error('failed to create a comment!', er)
        return {success : false, error : 'failed to create a comment!'}
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