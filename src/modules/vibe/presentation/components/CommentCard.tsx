"use client";
import { useState } from 'react';
import Link from 'next/link';
import { deleteComment, createComment } from '@/actions/post.action';
import { toast } from '@/components/ui/toast';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { formatRelativeTime } from "@/lib/utils";
import { Trash2Icon, ReplyIcon, SendIcon, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/components/auth/SessionProvider';
import { acceptSolutionAction, unacceptSolutionAction } from '@/actions/qa.action';
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
    isReply = false
}: { 
    comment: any, 
    dbUserId: string | null, 
    postId: string,
    postAuthorId?: string,
    isReply?: boolean
}) {
    const { user, isAuthenticated } = useSession();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [localReplies, setLocalReplies] = useState<any[]>(comment.replies || []);
    const [showReplies, setShowReplies] = useState(false);
    const [isSolution, setIsSolution] = useState(Boolean(comment.isSolution));
    const [isTogglingSolution, setIsTogglingSolution] = useState(false);

    const currentUserId = dbUserId || user?.id;
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
        if (!replyContent.trim() || isSubmittingReply) return;
        const text = replyContent;
        const optimisticId = `optimistic-reply-${Date.now()}`;

        try {
            setIsSubmittingReply(true);
            setReplyContent('');
            setShowReplyForm(false);

            const optimisticReply = {
                id: optimisticId,
                content: text,
                authorId: dbUserId,
                postId,
                parentId: comment.id,
                createdAt: new Date().toISOString(),
                author: {
                    id: dbUserId,
                    name: user?.name || user?.username || user?.email.split('@')[0] || "You",
                    username: user?.username || user?.name || "",
                    image: user?.image || null
                }
            };

            setLocalReplies((prev) => [...prev, optimisticReply]);
            setShowReplies(true);

            const result = await createComment(postId, text, comment.id);
            if (result?.success) {
                toast.success('Reply posted successfully');
            } else {
                toast.error(result?.error || 'Failed to post reply');
                setLocalReplies((prev) => prev.filter((r) => r.id !== optimisticId));
                setReplyContent(text);
                setShowReplyForm(true);
            }
        } catch (error) {
            toast.error('Failed to post reply');
            setLocalReplies((prev) => prev.filter((r) => r.id !== optimisticId));
            setReplyContent(text);
            setShowReplyForm(true);
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
                <div className="flex-1 min-w-0 pr-12">
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
                    <p className="text-sm break-words mt-0.5">{comment.content}</p>
                    
                    <div className="flex items-center gap-3 mt-1.5">
                        {isSolution && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <CheckCircle2 className="size-3 text-emerald-400" />
                                <span>Accepted Solution</span>
                            </span>
                        )}

                        {!isReply && isAuthenticated && (
                            <button
                                onClick={() => setShowReplyForm((prev) => !prev)}
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ReplyIcon className="size-3.5" />
                                <span>Reply</span>
                            </button>
                        )}

                        {!isReply && localReplies.length > 0 && (
                            <button
                                onClick={() => setShowReplies((prev) => !prev)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline transition-colors"
                            >
                                <span>{showReplies ? "Hide replies" : `View ${localReplies.length} ${localReplies.length === 1 ? "reply" : "replies"}`}</span>
                            </button>
                        )}

                        {!isReply && isQuestionAuthor && (
                            <button
                                onClick={handleToggleSolution}
                                disabled={isTogglingSolution}
                                className={`inline-flex items-center gap-1 text-xs transition-colors ${
                                    isSolution
                                        ? "text-emerald-400 hover:text-red-400"
                                        : "text-muted-foreground hover:text-emerald-400"
                                }`}
                            >
                                <CheckCircle2 className="size-3.5" />
                                <span>
                                    {isTogglingSolution
                                        ? "Updating..."
                                        : isSolution
                                        ? "Unmark Solution"
                                        : "Accept Solution"}
                                </span>
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
                    <Textarea
                        placeholder={`Replying to @${comment.author.username}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[60px] text-xs bg-background border border-border/50 rounded-xl focus-visible:ring-1 focus-visible:ring-border"
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setShowReplyForm(false); setReplyContent(''); }}
                            className="text-xs h-7 px-3"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAddReply}
                            disabled={!replyContent.trim() || isSubmittingReply}
                            className="btn-gradient text-xs h-7 px-3 flex items-center gap-1.5"
                        >
                            <SendIcon className="size-3" />
                            <span>Reply</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Nested Replies Rendering */}
            {!isReply && localReplies.length > 0 && showReplies && (
                <div className="space-y-3">
                    {localReplies.map((reply: any) => (
                        <CommentCard
                            key={reply.id}
                            comment={reply}
                            dbUserId={dbUserId}
                            postId={postId}
                            isReply={true}
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
