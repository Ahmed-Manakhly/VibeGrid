"use client"
import { useState } from 'react';
import { deleteComment } from '@/actions/post.action';
import { toast } from '@/components/ui/toast';
import { Avatar, AvatarImage } from './ui/avatar';
import { formatDistanceToNow } from "date-fns";
import { formatRelativeTime } from "@/lib/utils";
import { TrashIcon } from 'lucide-react';
import { Button } from './ui/button';

export function CommentCard({ comment, dbUserId, postId }: { comment: any, dbUserId: string | null, postId: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    
    // We will just hide the comment on successful delete for optimistic UI since 
    // it's passed as a prop from PostCard. A full refetch via revalidatePath happens on server.
    const [isDeleted, setIsDeleted] = useState(false);

    const handleDelete = async () => {
        if (isDeleting) return;
        try {
            setIsDeleting(true);
            const result = await deleteComment(comment.id);
            if (result?.success) {
                toast.success('Comment deleted');
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

    if (isDeleted) return null;

    return (
        <div className="flex space-x-3 group relative">
            <Avatar className="size-8 flex-shrink-0">
                <AvatarImage src={comment.author.image ?? "/avatar.png"} />
            </Avatar>
            <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center gap-x-1 sm:gap-x-2 text-[11px] sm:text-xs text-muted-foreground truncate min-w-0">
                    <span className="font-medium text-[13px] sm:text-sm text-foreground truncate">{comment.author.name}</span>
                    <span className="truncate">@{comment.author.username}</span>
                    <span className="shrink-0">•</span>
                    <span className="shrink-0 hidden sm:inline" suppressHydrationWarning>{formatDistanceToNow(new Date(comment.createdAt))} ago</span>
                    <span className="shrink-0 sm:hidden" suppressHydrationWarning>{formatRelativeTime(new Date(comment.createdAt))}</span>
                </div>
                <p className="text-sm break-words">{comment.content}</p>
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
                        <TrashIcon className="size-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
