'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DeleteAlertDialog } from './DeleteAlertDialog';
import { deletePost } from '@/actions/post.action';
import { toast } from '@/components/ui/toast';

interface PostDeleteActionProps {
  postId: string;
}

export function PostDeleteAction({ postId }: PostDeleteActionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deletePost(postId);
      if (result?.success) {
        toast.success('Vibe deleted successfully');
        // Dispatch local event for instant optimistic removal across all open feeds
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vibe_deleted', { detail: { postId } }));
        }
        router.refresh();
      }
    } catch {
      toast.error('Failed to delete vibe!');
    } finally {
      setIsDeleting(false);
    }
  };

  return <DeleteAlertDialog isDeleting={isDeleting} onDelete={handleDeletePost} />;
}
