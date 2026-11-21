"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { deleteComment, createComment, toggleCommentLikeAction, getCommentLikersAction } from '@/actions/post.action';
import { toast } from '@/components/ui/toast';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { formatRelativeTime } from "@/lib/utils";
import { Trash2Icon, ReplyIcon, SendIcon, CheckCircle2, Heart, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MentionTextarea } from '@/components/MentionTextarea';
import { useSession } from '@/components/auth/SessionProvider';
import { acceptSolutionAction, unacceptSolutionAction } from '@/actions/qa.action';
import { TruncatedLinkifiedText } from '@/components/TruncatedLinkifiedText';
import { useRealtime } from '@/shared/infrastructure/socket/RealtimeProvider';
import { PostMediaContainer } from './PostMediaContainer';
import ImageUpload from '@/components/ImageUpload';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CommentCard({ 
    comment, 
    dbUserId, 
    postId,
    postAuthorId,
    isReply = false,
    onCommentCountChange
}: { 
    comment: any, 
    dbUserId: string | null, 
    postId: string,
    postAuthorId?: string,
    isReply?: boolean,
    onCommentCountChange?: (delta: number) => void
}) {
    const { user, isAuthenticated } = useSession();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const currentUserId = dbUserId || user?.id;
    const { latestFeedSignal } = useRealtime();

    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [replyMediaUrl, setReplyMediaUrl] = useState('');
    const [showReplyMediaUpload, setShowReplyMediaUpload] = useState(false);
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [localReplies, setLocalReplies] = useState<any[]>(comment.replies || []);
    const [showAllReplies, setShowAllReplies] = useState(false);
    const [isSolution, setIsSolution] = useState(Boolean(comment.isSolution));
    const [isTogglingSolution, setIsTogglingSolution] = useState(false);
    
    // Comment / Reply Likes
    const initialLiked = Boolean(
      currentUserId &&
      comment.likes &&
      comment.likes.some((l: any) => l.userId === currentUserId || l.user?.id === currentUserId)
    );
    const initialLikesCount = comment._count?.likes ?? (comment.likes ? comment.likes.length : 0);

    const [isLiked, setIsLiked] = useState(initialLiked);
    const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
    const [isTogglingLike, setIsTogglingLike] = useState(false);

    // Likers List Modal / Hover state
    const [showLikersModal, setShowLikersModal] = useState(false);
    const [likersList, setLikersList] = useState<any[]>(comment.likes || []);
    const [isLoadingLikers, setIsLoadingLikers] = useState(false);
    const likersPopupRef = useRef<HTMLDivElement>(null);

    // Keep localReplies synchronized whenever parent passes down updated replies (e.g. from PostCommentsSection)
    useEffect(() => {
        if (comment.replies && Array.isArray(comment.replies)) {
            setLocalReplies((prev) => {
                const existingMap = new Map(prev.map((r: any) => [r.id, r]));
                const merged = comment.replies.map((r: any) => existingMap.get(r.id) || r);
                const incomingIds = new Set(comment.replies.map((r: any) => r.id));
                const brandNewLocal = prev.filter((r: any) => !incomingIds.has(r.id));
                return [...merged, ...brandNewLocal];
            });
        }
    }, [comment.replies]);

    // Keep initial liked / count synced when prop updates
    useEffect(() => {
        if (currentUserId && comment.likes) {
            setIsLiked(comment.likes.some((l: any) => l.userId === currentUserId || l.user?.id === currentUserId));
        }
        if (typeof comment._count?.likes === 'number') {
            setLikesCount(comment._count.likes);
        }
    }, [comment.likes, comment._count?.likes, currentUserId]);

    // Realtime Signal Listener for comment likes and replies
    useEffect(() => {
        if (!latestFeedSignal) return;

        // 1. Reply added in real-time to this comment
        if (
            latestFeedSignal.type === 'comment_added' &&
            latestFeedSignal.postId === postId &&
            latestFeedSignal.comment?.parentId === comment.id
        ) {
            const incomingReply = latestFeedSignal.comment;
            setLocalReplies((prev) => {
                if (prev.some((r: any) => r.id === incomingReply.id)) {
                    return prev;
                }
                return [...prev, incomingReply];
            });
            setShowAllReplies(true);
        }

        // 2. Real-time like toggled on this specific comment or reply
        if (
            latestFeedSignal.type === 'comment_like_toggled' &&
            latestFeedSignal.commentId === comment.id &&
            latestFeedSignal.commentLikeData
        ) {
            const { userId: likerUserId, isLiked: nextLiked, likesCount: nextCount, user: likerUser } = latestFeedSignal.commentLikeData;
            setLikesCount(nextCount);
            if (currentUserId && likerUserId === currentUserId) {
                setIsLiked(nextLiked);
            }
            if (likerUser) {
                setLikersList((prev) => {
                    if (nextLiked) {
                        if (prev.some((l: any) => l.userId === likerUserId || l.user?.id === likerUserId)) return prev;
                        return [{ userId: likerUserId, user: likerUser, createdAt: new Date() }, ...prev];
                    } else {
                        return prev.filter((l: any) => l.userId !== likerUserId && l.user?.id !== likerUserId);
                    }
                });
            }
        }
        // 3. Real-time solution accepted or unmarked
        if (
            latestFeedSignal.type === 'solution_toggled' &&
            latestFeedSignal.postId === postId
        ) {
            if (latestFeedSignal.isSolution) {
                // If this comment was marked as the solution
                setIsSolution(latestFeedSignal.commentId === comment.id);
            } else {
                // Solution unmarked across the question
                setIsSolution(false);
            }
        }
    }, [latestFeedSignal, postId, comment.id, currentUserId]);

    const fetchLiveLikers = async () => {
        if (isLoadingLikers) return;
        setIsLoadingLikers(true);
        try {
            const res = await getCommentLikersAction(comment.id);
            if (res.success && Array.isArray(res.data)) {
                setLikersList(res.data);
            }
        } catch {
            // Keep existing
        } finally {
            setIsLoadingLikers(false);
        }
    };

    const handleToggleLike = async () => {
        if (!isAuthenticated) {
            toast.error("Please sign in to like comments");
            return;
        }
        if (isTogglingLike) return;

        const prevLiked = isLiked;
        const prevCount = likesCount;

        // Optimistic update
        setIsLiked(!prevLiked);
        setLikesCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

        try {
            setIsTogglingLike(true);
            const res = await toggleCommentLikeAction(comment.id, postId);
            if (!res.success) {
                // Revert
                setIsLiked(prevLiked);
                setLikesCount(prevCount);
                toast.error(res.error || "Failed to like comment");
            } else {
                setIsLiked(Boolean(res.hasLiked));
                setLikesCount(typeof res.likesCount === 'number' ? res.likesCount : prevCount);
            }
        } catch {
            setIsLiked(prevLiked);
            setLikesCount(prevCount);
            toast.error("Failed to like comment");
        } finally {
            setIsTogglingLike(false);
        }
    };

    const isQuestionAuthor = Boolean(currentUserId && postAuthorId && currentUserId === postAuthorId);
    const canDelete = Boolean(currentUserId && (currentUserId === comment.authorId || currentUserId === comment.author?.id));

    const handleToggleSolution = async () => {
        if (isTogglingSolution) return;
        try {
            setIsTogglingSolution(true);
            if (isSolution) {
                const res = await unacceptSolutionAction(postId);
                if (res.success) {
                    setIsSolution(false);
                    toast.success("Solution unmarked");
                } else {
                    toast.error(res.error || "Failed to unmark solution");
                }
            } else {
                const res = await acceptSolutionAction(postId, comment.id);
                if (res.success) {
                    setIsSolution(true);
                    toast.success("Accepted as verified solution! 🎉");
                } else {
                    toast.error(res.error || "Failed to accept solution");
                }
            }
        } catch {
            toast.error("Failed to update solution");
        } finally {
            setIsTogglingSolution(false);
        }
    };

    const handleDelete = async () => {
        if (isDeleting) return;
        try {
            setIsDeleting(true);
            const result = await deleteComment(comment.id);
            if (result?.success) {
                toast.success(isReply ? 'Reply deleted' : 'Comment deleted');
                setIsDeleted(true);
                if (!isReply) {
                    onCommentCountChange?.(-1);
                }
                setShowDeleteModal(false);
            } else {
                toast.error(result?.error || 'Failed to delete comment');
            }
        } catch (error) {
            toast.error('Failed to delete comment');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddReply = async () => {
        if ((!replyContent.trim() && !replyMediaUrl) || isSubmittingReply) return;
        const text = replyContent;
        const mediaUrl = replyMediaUrl || undefined;

        try {
            setIsSubmittingReply(true);

            const result = await createComment(postId, text, comment.id, mediaUrl);
            if (result?.success && result.comment) {
                toast.success('Reply posted successfully');
                setLocalReplies((prev) => {
                    if (prev.some((r: any) => r.id === result.comment.id)) {
                        return prev;
                    }
                    return [...prev, result.comment];
                });
                setShowAllReplies(true);
                setReplyContent('');
                setReplyMediaUrl('');
                setShowReplyMediaUpload(false);
                setShowReplyForm(false);
            } else {
                toast.error(result?.error || 'Failed to post reply');
                if (result?.requiresPolicy) {
                    window.dispatchEvent(new CustomEvent('open-policy-prompt'));
                }
            }
        } catch (error) {
            toast.error('Failed to post reply');
        } finally {
            setIsSubmittingReply(false);
        }
    };

    if (isDeleted) return null;

    return (
        <div className={`space-y-3 ${isReply ? 'ml-6 sm:ml-8 pt-2 border-l-2 border-border/40 pl-3 sm:pl-4' : ''}`}>
            <div className="flex space-x-3 group relative">
                <Link href={`/profile/${comment.author.username || comment.author.id}`}>
                    <UserAvatar src={comment.author.image} name={comment.author.name} className={`${isReply ? 'size-7' : 'size-8'} flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity`} />
                </Link>
                <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-x-1 sm:gap-x-2 text-[11px] sm:text-xs text-muted-foreground truncate min-w-0">
                        <Link href={`/profile/${comment.author.username || comment.author.id}`} className="font-medium text-[13px] sm:text-sm text-foreground truncate hover:underline">
                            {comment.author.name || comment.author.username}
                        </Link>
                        <Link href={`/profile/${comment.author.username || comment.author.id}`} className="truncate hover:underline">
                            @{comment.author.username}
                        </Link>
                        <span className="shrink-0">•</span>
                        <span className="shrink-0 hidden sm:inline" suppressHydrationWarning>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                        <span className="shrink-0 sm:hidden" suppressHydrationWarning>{formatRelativeTime(new Date(comment.createdAt))}</span>
                    </div>
                    <div className="mt-0.5">
                        <TruncatedLinkifiedText text={comment.content} limit={160} className="text-sm break-words leading-relaxed text-foreground" />
                    </div>

                    {comment.mediaUrl && (
                        <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-border/40">
                            <PostMediaContainer mediaUrl={comment.mediaUrl} mediaType={comment.mediaType || "IMAGE"} className="w-full max-h-60 object-contain rounded-xl" />
                        </div>
                    )}
                    
                    {/* Row 1: Solution Status & Author Management Controls */}
                    {(isSolution || (!isReply && isQuestionAuthor)) && (
                        <div className="flex items-center gap-1.5 mt-1">
                            {isSolution && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-medium leading-none whitespace-nowrap text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                    <CheckCircle2 className="size-2.5 text-emerald-400 shrink-0" />
                                    <span>Solution</span>
                                </span>
                            )}

                            {!isReply && isQuestionAuthor && (
                                <button
                                    type="button"
                                    onClick={handleToggleSolution}
                                    disabled={isTogglingSolution}
                                    className={`inline-flex items-center gap-1 text-[9px] font-medium leading-none whitespace-nowrap transition-colors px-2 py-0.5 rounded-full border shrink-0 ${
                                        isSolution
                                            ? "text-muted-foreground border-border/40 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10"
                                            : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-500/40"
                                    }`}
                                >
                                    <CheckCircle2 className="size-2.5 shrink-0" />
                                    <span>
                                        {isTogglingSolution
                                            ? "..."
                                            : isSolution
                                            ? "Unmark"
                                            : "Accept"}
                                    </span>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Row 2: Social Actions (Like, Reply, View/Hide Replies) */}
                    <div className="flex items-center flex-wrap gap-2 mt-1 relative">
                        {/* Like button for comment / reply with Likers hover popup */}
                        <div
                            ref={likersPopupRef}
                            className="relative group/commentlike inline-flex items-center"
                            onMouseEnter={() => {
                                if (likesCount > 0) {
                                    setShowLikersModal(true);
                                    fetchLiveLikers();
                                }
                            }}
                            onMouseLeave={() => setShowLikersModal(false)}
                        >
                            <button
                                type="button"
                                onClick={handleToggleLike}
                                disabled={isTogglingLike}
                                className={`inline-flex items-center gap-1 text-[10px] leading-none whitespace-nowrap transition-colors py-0.5 px-1 rounded hover:bg-rose-500/10 ${
                                    isLiked ? "text-rose-500 font-medium" : "text-muted-foreground hover:text-rose-500"
                                }`}
                                title="Like"
                            >
                                <Heart className={`size-3 ${isLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                                {likesCount > 0 && <span className="font-mono">{likesCount}</span>}
                            </button>

                            {/* Who Liked Popup Tooltip */}
                            {showLikersModal && likesCount > 0 && (
                                <div className={`absolute bottom-full mb-1.5 z-40 min-w-[190px] max-w-[240px] p-2 rounded-xl bg-card/95 border border-border/80 shadow-xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 pointer-events-auto ${
                                    isReply ? "left-0 sm:left-0 -translate-x-12 sm:translate-x-0" : "left-0"
                                }`}>
                                    <div className="flex items-center justify-between border-b border-border/40 pb-1 mb-1">
                                        <p className="text-[9px] font-mono font-semibold text-muted-foreground uppercase tracking-wider">
                                            Liked by ({likesCount})
                                        </p>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowLikersModal(false);
                                            }}
                                            className="text-[9px] text-muted-foreground hover:text-foreground font-mono sm:hidden"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5 scrollbar-thin">
                                        {isLoadingLikers && likersList.length === 0 ? (
                                            <div className="py-2 text-center text-[10px] text-muted-foreground">
                                                Loading...
                                            </div>
                                        ) : likersList.length > 0 ? (
                                            likersList.slice(0, 10).map((likeItem: any, idx: number) => {
                                                const u = likeItem.user || likeItem;
                                                return (
                                                    <Link
                                                        key={idx}
                                                        href={`/profile/${u.username || u.id}`}
                                                        className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted/50 transition-colors"
                                                    >
                                                        <UserAvatar src={u.image} name={u.name} className="size-4 shrink-0" />
                                                        <div className="min-w-0 flex-1 truncate text-left">
                                                            <p className="text-[10px] font-medium text-foreground truncate leading-tight">
                                                                {u.name || u.username}
                                                            </p>
                                                            <p className="text-[9px] text-muted-foreground truncate leading-tight">
                                                                @{u.username}
                                                            </p>
                                                        </div>
                                                    </Link>
                                                );
                                            })
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground py-1 text-center">
                                                No likers recorded
                                            </p>
                                        )}
                                        {likesCount > 10 && likersList.length > 10 && (
                                            <p className="text-[9px] text-muted-foreground text-center pt-0.5">
                                                and {likesCount - 10} others...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isReply && isAuthenticated && (
                            <button
                                type="button"
                                onClick={() => setShowReplyForm((prev) => !prev)}
                                className="inline-flex items-center gap-0.5 text-[10px] leading-none whitespace-nowrap text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ReplyIcon className="size-2.5" />
                                <span>Reply</span>
                            </button>
                        )}

                        {!isReply && localReplies.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setShowAllReplies((prev) => !prev)}
                                className="inline-flex items-center gap-0.5 text-[10px] leading-relaxed break-words font-medium text-accent hover:underline transition-colors"
                            >
                                <span>{showAllReplies ? "Hide older replies" : `View ${localReplies.length - 1} previous ${localReplies.length - 1 === 1 ? "reply" : "replies"}`}</span>
                            </button>
                        )}
                    </div>
                </div>
                
                {canDelete && (
                    <div className="opacity-70 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity absolute right-0 top-0">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setShowDeleteModal(true)}
                            disabled={isDeleting}
                            aria-label="Delete comment"
                            title="Delete comment"
                        >
                            <Trash2Icon className="size-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Reply Input Box */}
            {showReplyForm && !isReply && (
                <div className="ml-8 space-y-2 pt-2">
                    <MentionTextarea
                        placeholder={`Replying to @${comment.author.username}... (type @ to mention)`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        postId={comment.postId}
                        className="min-h-[60px] text-xs bg-background border border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-border"
                    />

                    {(showReplyMediaUpload || replyMediaUrl) && (
                        <div className="p-2 border border-border/40 rounded-xl bg-card/40">
                            <ImageUpload
                                value={replyMediaUrl}
                                onChange={(url) => {
                                    setReplyMediaUrl(url);
                                    if (!url) setShowReplyMediaUpload(false);
                                }}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowReplyMediaUpload(!showReplyMediaUpload)}
                            className={`h-7 px-2 text-xs gap-1 rounded-lg ${
                                replyMediaUrl ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <ImageIcon className="size-3" />
                            <span>{replyMediaUrl ? "Change Image" : "Image"}</span>
                        </Button>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setShowReplyForm(false); setReplyContent(''); setReplyMediaUrl(''); setShowReplyMediaUpload(false); }}
                                className="text-xs h-7 px-3"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleAddReply}
                                disabled={(!replyContent.trim() && !replyMediaUrl) || isSubmittingReply}
                                className="btn-gradient text-xs h-7 px-3 flex items-center gap-1.5"
                            >
                                <SendIcon className="size-3" />
                                <span>Reply</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Nested Replies Rendering (LinkedIn pattern: latest reply auto-shown, older replies revealed via button) */}
            {!isReply && localReplies.length > 0 && (
                <div className="space-y-3">
                    {(showAllReplies ? localReplies : localReplies.slice(-1)).map((reply: any) => (
                        <CommentCard
                            key={reply.id}
                            comment={reply}
                            dbUserId={dbUserId}
                            postId={postId}
                            isReply={true}
                            onCommentCountChange={onCommentCountChange}
                        />
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <AlertDialogContent className="rounded-2xl max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isReply ? "Delete Reply?" : "Delete Comment?"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this {isReply ? "reply" : "comment"}. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel disabled={isDeleting} className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold rounded-xl"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
