"use server" ;

import { prisma } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getDbUserId } from "./user.action";
import { revalidatePath } from "next/cache";
import { error } from "console";



//1//to create the post
export async function creatPost( content :string, imageUrl : string){
    try {
        const userId = await getDbUserId() ;
        if(!userId) return ; // same way to handle null error that emapct >authorId : userId | but will cause an error with using the function also
        const post = await prisma.post.create({
            data : {
                content,
                image : imageUrl,
                authorId : userId
            }            
        })
        revalidatePath('/') ; //This function allows you to purge cached data on-demand for a specific path || post will be fetched immediately in the homepage
        return {success : true , post} ; 
    }catch (er){
        console.error('failed to create a post!' , er)
        return {success : false, error : 'failed to create a post!'}
    }
}
//2//to get all posts
export async function getPosts(){
    try {
        const posts = await prisma.post.findMany({
            include : {
                author : {
                    select :{
                        id : true,
                        name : true,
                        image : true,
                        username : true,
                    }
                } ,
                comments : {
                    include : {
                        author : {
                            select : {
                                id : true,
                                name : true,
                                image : true,
                                username : true,
                            }
                        }
                    },
                    orderBy : {
                        createdAt : 'asc' // the latest at the bottem
                    }
                },
                likes : {
                    select : {
                        userId : true,
                    }
                } ,
                _count : {
                    select : {
                        likes : true,
                        comments : true,
                    }
                },
            },
            orderBy : {
                createdAt : 'desc' // the latest at the top
            }
        })
        revalidatePath('/') ; 
        return posts ; // to match the type
        // return {success : true , posts} ; 
    }catch (er){
        console.error('failed to fetch posts!' , er)
        // return {success : false, error : 'failed to fetch posts!'}
        throw new Error('failed to fetch posts!') // to match the type or we can return []
    }
}
//3// to toggle Likes on the post
export async function toggleLike(postId : string){
    try {
        //get current user
        const userId = await getDbUserId() ;
        //if no auth return
        if(!userId) return;
        //check if current user liked same post before to toggle => exLike
        const exLike = await prisma.like.findUnique({
            where :{
                userId_postId :{
                    postId,
                    userId, 
                },
            },
        });
        //find the post itself and bring the author of post => post + post author
        const post = await prisma.post.findUnique({
            where : { id : postId},
            select:{authorId : true}
        });
        // if not found post
        if(!post) throw new Error('post not found!') ;
        //---------------------- if yes liked so unlike
        if(exLike){
            await prisma.like.delete({
                where :{
                    userId_postId :{
                        postId,
                        userId,
                    }
                }
            })
        }else{
            // we need to do punch of things so use transactions array to get all or nothing
            //1- didn't like before so like  => create
            //2- will create notification if liking only someone else's post =>create notifications
            await prisma.$transaction([
                prisma.like.create({
                    data :{
                        postId,
                        userId,
                    }
                }),...( // extract the coming array into the parent array | comming array will be one of both based on the condition
                    // check if the author of post is the current user
                    post.authorId === userId?
                    //if yes => empty array | will not create notification
                    [] :
                    //if no => array => create notifications method
                    [
                        prisma.notifications.create({
                            data : {
                                type : 'LIKE',
                                creatorId : userId, //sender  current user
                                userId : post.authorId, //receiver post author
                                postId,
                            }
                        })
                    ]
                )
            ])   
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
        //find post
        const post = await prisma.post.findUnique({
            where : {id : postId}
        })
        //if no post
        if(!post) throw new Error('post not found!') ;
        //create comment and notification in transaction | as usual prisma.$transaction(takes an array of prisma operations) | and we made before with ...conditional
        //this time it's going to be a funtion that taks prisma itself, or instanc of the transactions creator as an argument | and return that array
        //so we will be able to distracure the comment of this array to return it and notification is created in case the user in not commented on his post
        //and also based on the comment id we have created the notification
        const [comment] = await prisma.$transaction(async (prisma) => { //  [comment] distracure of the returned array
            //create the comment 1st
            const newComment = await prisma.comment.create({
                data : {
                    content,
                    authorId : userId,
                    postId,
                }
            })
            //if the author of post is not the current user | create the notification based on the comment id
            if(post.authorId !== userId){
                await prisma.notifications.create({
                    data : {
                        type : 'COMMENT',
                        userId : post.authorId,
                        creatorId : userId,
                        postId,
                        commenttId : newComment.id // we got comment id 1st
                    }
                })
            }
            return [newComment] ; // return the array with on element that we will distracure| it cloud be just the newComment not array
        });
        revalidatePath('/') ;
        return {success : true , comment} ;
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
        //find the post with only authorId for better performance
        const post = await prisma.post.findUnique({
            where : {id : postId},
            select : {authorId : true}
        })
        //if no post
        if(!post) throw new Error('post not found!') ;
        //if the post author is not the current user
        if(post.authorId !== userId) throw new Error('you are not the author of this post!') ;
        //delete the post
        await prisma.post.delete({
            where : {id : postId}
        })
        revalidatePath('/') ; // purge the cash
        return {success : true} ;
    }catch (er){
        console.error('failed to delete a post!', er)
        return {success : false, error : 'failed to delete a post!'}
    }
}