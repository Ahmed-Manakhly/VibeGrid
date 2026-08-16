"use client"
import { createComment, deletePost, getPosts, toggleLike } from '@/actions/post.action';
import { SignInButton, useUser } from '@clerk/nextjs';
// for types
// import { Post } from '@prisma/client' ;
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import Link from 'next/link';
import { Avatar, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from "date-fns";
import { formatRelativeTime } from "@/lib/utils";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { CommentCard } from "./CommentCard";
import Image from 'next/image'
import { Button } from './ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon } from 'lucide-react';
import { Textarea } from './ui/textarea';

//---------------------
//using post._count for [likesCount] will cause a type error as _count not coming from schema , but from the server action, so we will make our type
//we will use the type of the server action | but it's a fun , so wrap it with generic | and say we need the return type | but it's a promis | so the awaited of
//1- type posts = typeof getPosts | 2- type posts = <typeof getPosts> |3- ReturnType<typeof getPosts> | 4- Awaited<ReturnType<typeof getPosts>>
type FeedResponse = Awaited<ReturnType<typeof getPosts>>; 
type post = FeedResponse['data'][number] & { category?: any, vibe?: any, tags?: any[] };
//-----------------------------------------------
function PostCard({post , dbUserId, isTruncated = false, isDetailPage = false} : {post : post , dbUserId:string | null, isTruncated?: boolean, isDetailPage?: boolean}) { // updated | now post that we created not prisma schema Post
    const {user} = useUser();
    const [newComment,setNewComment] = useState('');
    const [isCommenting,setIsCommenting] = useState(false);
    const [isLiking,setIsLiking] = useState(false);
    const [isDeleting , setIsDeleting] = useState(false);
    //here we need to check on the DB if the user liked before or not instead of make it false initially
    // we will check the post likes and map on likes and checking id's of liker if it = current user id 
    // const [hasLiked , setHasLiked]= useState(false); // updated | some on the array of likes
    const [hasLiked , setHasLiked]= useState(post.likes.some(like => like.userId === dbUserId));
    //const [likesCount , setLikesCount] = useState(post._count.likes); // we will change it to Optimistic to use this concept [Optimistic UPDATES]
    //that means when the operation is going to take some times to be updated, we need to show the user on the UI updated state instead of loading & waiting DB VALUE
    const [optimisticLikes , setOptimisticLikes] = useState(post._count.likes);
    //--------------------------------------------------------- FUNCTIONALITY OF  LIKE & COMMENT BUTTON
    const [showComments , setShowComments] = useState(isDetailPage);
    const [localComments, setLocalComments] = useState(post.comments || []);
    
    useEffect(() => {
        setLocalComments(post.comments || []);
    }, [post.comments]);
    //---------------------------------------------------------

    const contentLimit = 150;
    const shouldTruncate = !isDetailPage && post.content && post.content.length > contentLimit;
    const displayContent = shouldTruncate && post.content ? post.content.slice(0, contentLimit) + "..." : post.content;
    const handleLike = async () => {
        if(isLiking) return;
        try {
            setIsLiking(true); // avoid double clicking | and use it for toggleing the like or dislike 
            setHasLiked(prev => !prev); // set it Optimistic before fetch the DB even before send post req to save the like or remove it
            setOptimisticLikes((prev:number) => hasLiked ? prev - 1 : prev + 1) ; // before fetch new number of likes set the ui state Optimistic
            await toggleLike(post.id) // create the server action on [post.action.ts]
        } catch (error) {
            setOptimisticLikes(post._count.likes) // reset
            setHasLiked(post.likes.some(like => like.userId === dbUserId)) // reset instead of false
        } finally {
            setIsLiking(false);
        }
    }
    //----------------------
    const handleAddComment = async () => {//create the server action on [post.action.ts] to create a comment |createComment
        if(!newComment.trim() || isCommenting) return;
        const commentText = newComment;
        const optimisticId = `optimistic-${Date.now()}`;
        
        try {
            setIsCommenting(true);
            setNewComment(''); // Optimistically clear input
            
            const optimisticComment = {
                id: optimisticId,
                content: commentText,
                authorId: dbUserId,
                postId: post.id,
                createdAt: new Date().toISOString(),
                author: {
                    id: dbUserId,
                    name: user?.fullName || user?.firstName || user?.username || "You",
                    username: user?.username || "",
                    image: user?.imageUrl || "/avatar.png"
                }
            };
            
            // Optimistically update the UI
            setLocalComments((prev: any) => [...prev, optimisticComment]);
            
            const result = await createComment(post.id, commentText);
            if(result?.success) {
                toast.success('comment posted successfully');
                // The useEffect will eventually sync the real ID when revalidatePath completes
            } else {
                toast.error(result?.error || 'failed to create comment!');
                // Rollback on expected failure
                setLocalComments((prev: any) => prev.filter((c: any) => c.id !== optimisticId));
                setNewComment(commentText);
            }
        } catch (error) {
            toast.error('failed to create comment!');
            // Rollback on unexpected failure
            setLocalComments((prev: any) => prev.filter((c: any) => c.id !== optimisticId));
            setNewComment(commentText);
        } finally {
            setIsCommenting(false);
        }
    }
    const handleDeletePost = async () => { //create the server action on [post.action.ts] to Delete Post | deletePost
        if(isDeleting) return;
        try {
            setIsDeleting(true);
            const result = await deletePost(post.id);
            if(result?.success) {
                toast.success('vibe deleted successfully');
            }
        } catch (error) {
            toast.error('failed to delete vibe!');
        } finally {
            setIsDeleting(false);
        }
    }
    //---------------------------------------
    // we will use date-fns to format our dates | npm i date-fns || + & from shadcn | npx shadcn@latest add alert-dialog | press yes
    //then we will use alert-dialog we got it in [ui] to create DeleteAlertDialog component | go to [components] [DeleteAlertDialog] 
    //DeleteAlertDialog the component needs isDeleting onDelete | 
    return (
        <article className="feed-card overflow-hidden pb-3 sm:pb-5">
                <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                    {/* AVATAR & METADATA */}
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <Link href={`/profile/${post.author.username}`} className="shrink-0">
                                <Avatar className="size-8 transition-all">
                                    <AvatarImage src={post.author.image ?? "/avatar.png"} />
                                </Avatar>
                            </Link>
                            <div className="flex flex-col min-w-0 flex-1">
                                <Link href={`/profile/${post.author.username}`} className="font-semibold text-[13px] sm:text-sm truncate">
                                    {post.author.name}
                                </Link>
                                <div className="flex items-center space-x-1 sm:space-x-2 text-[11px] sm:text-xs text-muted-foreground truncate min-w-0">
                                    <Link href={`/profile/${post.author.username}`} className="truncate">@{post.author.username}</Link>
                                    <span className="shrink-0">•</span>
                                    {isDetailPage ? (
                                        <>
                                            <span className="shrink-0 hidden sm:inline">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                                            <span className="shrink-0 sm:hidden">{formatRelativeTime(new Date(post.createdAt))}</span>
                                        </>
                                    ) : (
                                        <Link href={`/vibes/${post.id}`} className="hover:underline flex items-center space-x-1 sm:space-x-2">
                                            <span className="shrink-0 hidden sm:inline">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                                            <span className="shrink-0 sm:hidden">{formatRelativeTime(new Date(post.createdAt))}</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Check if current user is the post author */}
                        {dbUserId === post.author.id && (
                            <div className="shrink-0">
                                <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
                            </div>
                        )}
                    </div>

                    {/* TEXT CONTENT */}
                    {post.content && (
                        <div>
                            {isDetailPage ? (
                                <p className="text-[14px] sm:text-base text-foreground leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                                    {displayContent}
                                </p>
                            ) : (
                                <Link href={`/vibes/${post.id}`} className="block hover:opacity-80 transition-opacity">
                                    <p className="text-[14px] sm:text-base text-foreground leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">
                                        {displayContent}
                                    </p>
                                </Link>
                            )}
                            {shouldTruncate && (
                                <Link href={`/vibes/${post.id}`} className="inline-flex items-center mt-2 text-sm font-medium text-primary hover:text-foreground transition-colors group">
                                    <span className="group-hover:underline">Read more</span>
                                    <span className="ml-1 transition-transform group-hover:translate-x-1">&rarr;</span>
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* POST IMAGE if we have an image - FULL BLEED AFTER TEXT */}
                {!isTruncated && post.image && (
                    <div className="w-full bg-muted/30 border-y border-border/50">
                        <Image src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[600px]" width={800} height={600}/>
                    </div>
                )}
                
                <div className="px-3 sm:px-5 mt-3 sm:mt-4 space-y-3 sm:space-y-4">
                    {/* CATEGORY, VIBE & TAGS */}
                    {(post.category || post.vibe || (post.tags && post.tags.length > 0)) && (
                        <div className="flex flex-wrap gap-2 pt-1 sm:pt-2"> 
                            {post.category && (
                                <Link href={`/explore?category=${post.category.slug}`} className="px-3 py-1 text-[11px] rounded-full bg-primary/10 text-primary font-medium tracking-wide border-none hover:bg-primary/20 transition-colors">
                                    {post.category.emoji} {post.category.name}
                                </Link>
                            )}
                            {post.vibe && (
                                <Link href={`/explore?vibe=${post.vibe.key}`} className="px-3 py-1 text-[11px] rounded-full bg-background border border-transparent text-muted-foreground hover:text-foreground hover:border-border transition-colors font-medium tracking-wide">
                                    {post.vibe.label}
                                </Link>
                            )}
                            {post.tags && post.tags.slice(0, 4).map((postTag: any, idx: number) => (
                                <Link href={`/explore?tag=${postTag.tag.slug}`} key={idx} className="px-2.5 py-1 text-[10px] rounded-full bg-transparent border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors font-medium italic tracking-wide">
                                    #{postTag.tag.name}
                                </Link>
                            ))}
                            {post.tags && post.tags.length > 4 && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="px-2.5 py-1 text-[10px] rounded-full bg-transparent border border-border/30 text-muted-foreground/70 hover:text-foreground hover:border-border transition-colors font-medium tracking-wide">
                                            +{post.tags.length - 4}
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md bg-background border-border">
                                        <DialogHeader>
                                            <DialogTitle>All Tags</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex flex-wrap gap-2 pt-4">
                                            {post.tags.map((postTag: any, idx: number) => (
                                                <Link href={`/explore?tag=${postTag.tag.slug}`} key={idx} className="px-3 py-1.5 text-sm rounded-full bg-transparent border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors font-medium tracking-wide">
                                                    #{postTag.tag.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    )}
                    {/* LIKE & COMMENT BUTTONS */}
                    <div className="flex items-center pt-2 space-x-4">
                        {user ? (
                            <Button
                            className={`text-muted-foreground gap-2 hover:bg-transparent ${hasLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500" }`}
                            variant="ghost" size="sm" onClick={handleLike}
                            >
                                {hasLiked ? (
                                    <HeartIcon className="size-5 fill-current" />
                                ) : (
                                    <HeartIcon className="size-5" />
                                )}
                                <span>{optimisticLikes}</span>
                            </Button>
                        ) : (
                            <SignInButton mode="modal">
                                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 hover:bg-transparent hover:text-red-500">
                                    <HeartIcon className="size-5" />
                                    <span>{optimisticLikes}</span>
                                </Button>
                            </SignInButton>
                        )}
                        
                        {!isTruncated && (
                            <Button variant="ghost" size="sm" onClick={() => setShowComments((prev) => !prev)}
                            className="text-muted-foreground gap-2 hover:bg-transparent hover:text-accent">
                                <MessageCircleIcon className={`size-5 ${showComments ? "fill-accent text-accent" : ""}`} />
                                <span>{localComments.length}</span>
                            </Button>
                        )}
                    </div>
                     {/* COMMENTS SECTION */}
                    {!isTruncated && showComments && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="space-y-4">
                                {/* DISPLAY COMMENTS */}
                                {localComments.slice(0, isDetailPage ? 5 : 2).map((comment: any) => (
                                    <CommentCard key={comment.id} comment={comment} dbUserId={dbUserId} postId={post.id} />
                                ))}
                                {localComments.length > (isDetailPage ? 5 : 2) && (
                                    <Link href={`/vibes/${post.id}`} className="block text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">
                                        View all {localComments.length} comments &rarr;
                                    </Link>
                                )}
                            </div>
                            {user ? (
                                <div className="flex space-x-3">
                                    <Avatar className="size-8 flex-shrink-0">
                                        <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                                    </Avatar>
                                    <div className="flex-1">
                                        <Textarea placeholder="Drop a vibe..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                            className="min-h-[80px] resize-none bg-background border border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-border" />
                                        <div className="flex justify-end mt-2">
                                            <Button onClick={handleAddComment}
                                                size="sm"  className="btn-gradient flex items-center gap-2" disabled={!newComment.trim() || isCommenting} >
                                                {isCommenting ? (
                                                "Dropping..."
                                                ) : (
                                                <>
                                                    <SendIcon className="size-4" />
                                                    Vibe
                                                </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                                    <SignInButton mode="modal">
                                        <Button variant="outline" className="gap-2">
                                            <LogInIcon className="size-4" />
                                            Sign in to comment
                                        </Button>
                                    </SignInButton>
                                </div>
                            )}
                        </div>
                    )}
                </div>
        </article>
    )
}

export default PostCard