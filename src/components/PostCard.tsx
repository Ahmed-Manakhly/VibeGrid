"use client"
import { createComment, deletePost, getPosts, toggleLike } from '@/actions/post.action';
import { SignInButton, useUser } from '@clerk/nextjs';
// for types
// import { Post } from '@prisma/client' ;
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent } from './ui/card';
import Link from 'next/link';
import { Avatar, AvatarImage } from './ui/avatar';
//-------------------
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from './DeleteAlertDialog';
import Image from 'next/image'
import { Button } from './ui/button';
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon } from 'lucide-react';
import { Textarea } from './ui/textarea';

//---------------------
//using post._count for [likesCount] will cause a type error as _count not coming from schema , but from the server action, so we will make our type
//we will use the type of the server action | but it's a fun , so wrap it with generic | and say we need the return type | but it's a promis | so the awaited of
//1- type posts = typeof getPosts | 2- type posts = <typeof getPosts> |3- ReturnType<typeof getPosts> | 4- Awaited<ReturnType<typeof getPosts>>
type posts = Awaited<ReturnType<typeof getPosts>>; // still we need to get one post of the posts[]
type post = posts[number];// it shold extract a single post from the array | we can make index0 posts[0]
//-----------------------------------------------
function PostCard({post , dbUserId} : {post : post , dbUserId:string | null}) { // updated | now post that we created not prisma schema Post
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
    const [showComments , setShowComments] = useState(false)
    //---------------------------------------------------------
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
        try {
            setIsCommenting(true);
            const result = await createComment(post.id, newComment);
            if(result?.success) {
                toast.success('comment posted successfully');
                setNewComment(''); // reset
                // post.comments.push(result); // optimistic update
            }
            setNewComment('');
        } catch (error) {
            toast.error('failed to create comment!');
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
        <Card className="overflow-hidden bg-card/40 backdrop-blur-xl border-white/10 hover:border-white/20 transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                    <div className="flex space-x-3 sm:space-x-4">
                        {/* AVATAR */}
                        <Link href={`/profile/${post.author.username}`}>
                            <Avatar className="size-8 sm:w-10 sm:h-10 border border-white/10 hover:border-primary/50 transition-all">
                                <AvatarImage src={post.author.image ?? "/avatar.png"} />
                            </Avatar>
                        </Link>
                        {/* POST HEADER & TEXT CONTENT */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
                                    <Link href={`/profile/${post.author.username}`} className="font-semibold truncate">
                                        {post.author.name}
                                    </Link>
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                        <Link href={`/profile/${post.author.username}`}>@{post.author.username}</Link>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                                    </div>
                                </div>
                                {/* Check if current user is the post author */}
                                {dbUserId === post.author.id && (
                                    <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
                                )}
                            </div>
                            <p className="mt-2 text-sm text-foreground break-words">{post.content}</p>
                            
                            {/* MOOD & TAGS */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {post.mood && post.mood !== "neutral" && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary border border-primary/20 font-mono tracking-wide drop-shadow-[0_0_5px_rgba(0,240,255,0.3)]">
                                        {post.mood === 'excited' ? '🚀 Excited' :
                                         post.mood === 'learning' ? '📚 Learning' :
                                         post.mood === 'building' ? '💻 Building' :
                                         post.mood === 'debugging' ? '🐛 Debugging' : post.mood}
                                    </span>
                                )}
                                {post.tags && post.tags.map((tag: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 text-xs rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-mono tracking-wide drop-shadow-[0_0_5px_rgba(255,36,228,0.3)]">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* POST IMAGE if we have an image*/}
                    {post.image && (
                        <div className="rounded-lg overflow-hidden">
                            <Image src={post.image} alt="Post content" className="w-full h-auto object-cover" width={100} height={100}/>
                        </div>
                    )}
                    {/* LIKE & COMMENT BUTTONS */}
                    <div className="flex items-center pt-2 space-x-4">
                        {user ? (
                            <Button
                            className={`text-muted-foreground gap-2 ${hasLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500" }`}
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
                                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
                                    <HeartIcon className="size-5" />
                                    <span>{optimisticLikes}</span>
                                </Button>
                            </SignInButton>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setShowComments((prev) => !prev)}
                        className="text-muted-foreground gap-2 hover:text-blue-500">
                            <MessageCircleIcon className={`size-5 ${showComments ? "fill-blue-500 text-blue-500" : ""}`} />
                            <span>{post.comments.length}</span>
                        </Button>
                    </div>
                     {/* COMMENTS SECTION */}
                    {showComments && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="space-y-4">
                                {/* DISPLAY COMMENTS */}
                                {post.comments.map((comment) => (
                                    <div key={comment.id} className="flex space-x-3">
                                        <Avatar className="size-8 flex-shrink-0">
                                            <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <span className="font-medium text-sm">{comment.author.name}</span>
                                                <span className="text-sm text-muted-foreground">@{comment.author.username}</span>
                                                <span className="text-sm text-muted-foreground">·</span>
                                                <span className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                                            </div>
                                            <p className="text-sm break-words">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {user ? (
                                <div className="flex space-x-3">
                                    <Avatar className="size-8 flex-shrink-0">
                                        <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                                    </Avatar>
                                    <div className="flex-1">
                                        <Textarea placeholder="Drop a vibe..." value={newComment} onChange={(e) => setNewComment(e.target.value)}
                                            className="min-h-[80px] resize-none bg-black/20 border-white/10 focus-visible:ring-1 focus-visible:ring-primary/50" />
                                        <div className="flex justify-end mt-2">
                                            <Button onClick={handleAddComment}
                                                size="sm"  className="flex items-center gap-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all" disabled={!newComment.trim() || isCommenting} >
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
            </CardContent>
        </Card>
    )
}

export default PostCard