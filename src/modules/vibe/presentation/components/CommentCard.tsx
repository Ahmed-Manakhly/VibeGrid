"use client";
import { useState } from 'react';
import { deleteComment, createComment } from '@/actions/post.action';
import { toast } from '@/components/ui/toast';
import { UserAvatar } from '@/components/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { formatRelativeTime } from "@/lib/utils";
import { Trash2Icon, ReplyIcon, SendIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSession } from '@/components/auth/SessionProvider';

export function CommentCard({ 
    comment, 
    dbUserId, 
    postId,
    isReply = false
}: { 
    comment: any, 
    dbUserId: string | null, 
    postId: string,
    isReply?: boolean
}) {
    const { user, isAuthenticated } = useSession();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [localReplies, setLocalReplies] = useState<any[]>(comment.replies || []);

    const handleDelete = async () => {
        if (isDeleting) return;
        try {
            setIsDeleting(true);
            const result = await deleteComment(comment.id);
            if (result?.success) {
                toast.success(isReply ? 'Reply deleted' : 'Comment deleted');
                setIsDeleted(true);
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
                <UserAvatar src={comment.author.image} name={comment.author.name} className={`${isReply ? 'size-7' : 'size-8'} flex-shrink-0`} />
                <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-x-1 sm:gap-x-2 text-[11px] sm:text-xs text-muted-foreground truncate min-w-0">
                        <span className="font-medium text-[13px] sm:text-sm text-foreground truncate">{comment.author.name}</span>
                        <span className="truncate">@{comment.author.username}</span>
                        <span className="shrink-0">•</span>
                        <span className="shrink-0 hidden sm:inline" suppressHydrationWarning>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                        <span className="shrink-0 sm:hidden" suppressHydrationWarning>{formatRelativeTime(new Date(comment.createdAt))}</span>
                    </div>
                    <p className="text-sm break-words mt-0.5">{comment.content}</p>
                    
                    {!isReply && isAuthenticated && (
                        <button
                            onClick={() => setShowReplyForm((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 mt-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ReplyIcon className="size-3.5" />
                            <span>Reply</span>
                        </button>
                    )}
                </div>
                
                {dbUserId === comment.authorId && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            onClick={handleDelete}
                            disabled={isDeleting}
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
            {!isReply && localReplies.length > 0 && (
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
        </div>
    );
}
