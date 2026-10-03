"use client"
import { createComment, deletePost, getPosts, toggleLike } from '@/actions/post.action';
import { useSession } from '@/components/auth/SessionProvider';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/toast';

import Link from 'next/link';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDistanceToNow } from "date-fns";
import { formatRelativeTime } from "@/lib/utils";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { CommentCard } from "./CommentCard";
import urlRelative from '@/lib/utils/urlRelative';
import { EnvConfigRepository } from '@/modules/config/infrastructure/EnvConfigRepository';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HeartIcon, LogInIcon, MessageCircleIcon, SendIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { PostMediaContainer } from './PostMediaContainer';

type FeedResponse = Awaited<ReturnType<typeof getPosts>>; 
type post = FeedResponse['data'][number] & { category?: any, vibe?: any, tags?: any[], mediaUrl?: string | null, mediaType?: any };

function PostCard({post , dbUserId, isTruncated = false, isDetailPage = false} : {post : post , dbUserId:string | null, isTruncated?: boolean, isDetailPage?: boolean}) {
    const { user, isAuthenticated } = useSession();
    const [newComment,setNewComment] = useState('');
    const [isCommenting,setIsCommenting] = useState(false);
    const [isLiking,setIsLiking] = useState(false);
    const [isDeleting , setIsDeleting] = useState(false);

    const [hasLiked , setHasLiked]= useState(post.likes.some(like => like.userId === dbUserId));
    const [optimisticLikes , setOptimisticLikes] = useState(post._count.likes);
    const [showComments , setShowComments] = useState(isDetailPage);
    const [localComments, setLocalComments] = useState(post.comments || []);
    
    useEffect(() => {
        setLocalComments(post.comments || []);
    }, [post.comments]);

    const contentLimit = 150;
    const shouldTruncate = !isDetailPage && post.content && post.content.length > contentLimit;
    const displayContent = shouldTruncate && post.content ? post.content.slice(0, contentLimit) + "..." : post.content;
    const handleLike = async () => {
        if(isLiking) return;
        try {
            setIsLiking(true);
            setHasLiked(prev => !prev);
            setOptimisticLikes((prev:number) => hasLiked ? prev - 1 : prev + 1) ;
            await toggleLike(post.id)
        } catch {
            setOptimisticLikes(post._count.likes)
            setHasLiked(post.likes.some(like => like.userId === dbUserId))
        } finally {
            setIsLiking(false);
        }
    }

    const handleAddComment = async () => {
        if(!newComment.trim() || isCommenting) return;
        const commentText = newComment;
        const optimisticId = `optimistic-${Date.now()}`;
        
        try {
            setIsCommenting(true);
            setNewComment('');
            
            const optimisticComment = {
                id: optimisticId,
                content: commentText,
                authorId: dbUserId,
                postId: post.id,
                createdAt: new Date().toISOString(),
                author: {
                    id: dbUserId,
                    name: user?.name || user?.username || user?.email.split('@')[0] || "You",
                    username: user?.username || user?.name || "",
                    image: user?.image || null
                }
            };
            
            setLocalComments((prev: any) => [...prev, optimisticComment]);
            
            const result = await createComment(post.id, commentText);
            if(result?.success) {
                toast.success('comment posted successfully');
            } else {
                toast.error(result?.error || 'failed to create comment!');
                setLocalComments((prev: any) => prev.filter((c: any) => c.id !== optimisticId));
                setNewComment(commentText);
            }
        } catch {
            toast.error('failed to create comment!');
            setLocalComments((prev: any) => prev.filter((c: any) => c.id !== optimisticId));
            setNewComment(commentText);
        } finally {
            setIsCommenting(false);
        }
    }
    const handleDeletePost = async () => {
        if(isDeleting) return;
        try {
            setIsDeleting(true);
            const result = await deletePost(post.id);
            if(result?.success) {
                toast.success('vibe deleted successfully');
            }
        } catch {
            toast.error('failed to delete vibe!');
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <article className="feed-card overflow-hidden pb-3 sm:pb-5">
                <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <Link href={`/profile/${post.author.username}`} className="shrink-0">
                                <UserAvatar src={post.author.image} name={post.author.name} className="size-8 transition-all" />
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
                                            <span className="shrink-0 hidden sm:inline" suppressHydrationWarning>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                                            <span className="shrink-0 sm:hidden" suppressHydrationWarning>{formatRelativeTime(new Date(post.createdAt))}</span>
                                        </>
                                    ) : (
                                        <Link href={`/vibes/${post.id}`} className="hover:underline flex items-center space-x-1 sm:space-x-2">
                                            <span className="shrink-0 hidden sm:inline" suppressHydrationWarning>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
                                            <span className="shrink-0 sm:hidden" suppressHydrationWarning>{formatRelativeTime(new Date(post.createdAt))}</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                        {dbUserId === post.author.id && (
                            <div className="shrink-0">
                                <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />
                            </div>
                        )}
                    </div>

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

                {!isTruncated && post.mediaUrl && (
                    <PostMediaContainer mediaUrl={post.mediaUrl} mediaType={post.mediaType} />
                )}
                
                <div className="px-3 sm:px-5 mt-3 sm:mt-4 space-y-3 sm:space-y-4">
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
                        <div className="relative group/like inline-flex items-center">
                            {isAuthenticated ? (
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
                                <Button variant="ghost" size="sm" className="text-muted-foreground gap-2 hover:bg-transparent hover:text-red-500" asChild>
                                    <Link href="/login">
                                        <HeartIcon className="size-5" />
                                        <span>{optimisticLikes}</span>
                                    </Link>
                                </Button>
                            )}

                            {post.likes && post.likes.length > 0 && (
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/like:block group-focus-within/like:block z-30 min-w-[180px] max-w-[240px] p-2.5 rounded-xl bg-card border border-border/80 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 pointer-events-auto">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 border-b border-border/40 pb-1">
                                        Liked by ({optimisticLikes})
                                    </p>
                                    <div className="space-y-1 max-h-36 overflow-y-auto">
                                        {post.likes.slice(0, 5).map((likeItem: any, idx: number) => {
                                            const reactor = likeItem.user;
                                            const reactorName = reactor?.name || reactor?.username || 'Anonymous';
                                            const reactorHandle = reactor?.username ? `@${reactor.username}` : '';
                                            return (
                                                <Link
                                                    key={idx}
                                                    href={reactor?.username ? `/profile/${reactor.username}` : '#'}
                                                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted/60 transition-colors text-xs text-foreground truncate"
                                                >
                                                    <UserAvatar src={reactor?.image} name={reactorName} className="size-5 shrink-0" />
                                                    <span className="truncate font-medium">{reactorName}</span>
                                                    {reactorHandle && <span className="text-[10px] text-muted-foreground truncate">{reactorHandle}</span>}
                                                </Link>
                                            );
                                        })}
                                        {optimisticLikes > 5 && (
                                            <p className="text-[10px] text-muted-foreground pt-1 italic">
                                                and {optimisticLikes - 5} others...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {!isTruncated && (
                            <Button variant="ghost" size="sm" onClick={() => setShowComments((prev) => !prev)}
                            className="text-muted-foreground gap-2 hover:bg-transparent hover:text-accent">
                                <MessageCircleIcon className={`size-5 ${showComments ? "fill-accent text-accent" : ""}`} />
                                <span>{localComments.length}</span>
                            </Button>
                        )}
                    </div>
                    {!isTruncated && showComments && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="space-y-4">
                                {localComments.slice(0, isDetailPage ? 5 : 2).map((comment: any) => (
                                    <CommentCard key={comment.id} comment={comment} dbUserId={dbUserId} postId={post.id} />
                                ))}
                                {localComments.length > (isDetailPage ? 5 : 2) && (
                                    <Link href={`/vibes/${post.id}`} className="block text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">
                                        View all {localComments.length} comments &rarr;
                                    </Link>
                                )}
                            </div>
                            {isAuthenticated ? (
                                <div className="flex space-x-3">
                                    <UserAvatar src={user?.image} name={user?.name} className="size-8 flex-shrink-0" />
                                    <div className="flex-1">
                                        <Textarea placeholder="Drop a vibe..." value={newComment} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
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
                                    <Button variant="outline" className="gap-2" asChild>
                                        <Link href="/login">
                                            <LogInIcon className="size-4" />
                                            Sign in to comment
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
        </article>
    )
}

export default PostCard