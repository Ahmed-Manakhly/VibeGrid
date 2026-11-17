'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmbeddedQuotedPostCard } from './EmbeddedQuotedPostCard';
import { createQuoteVibeAction } from '@/actions/post.action';
import { getUserCommunitiesAction } from '@/actions/community.action';
import { useSession } from '@/components/auth/SessionProvider';
import { toast } from '@/components/ui/toast';
import { MessageSquareQuote, Loader2, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuoteVibeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetPost: {
    id: string;
    content: string | null;
    mediaUrl?: string | null;
    postType?: string | null;
    createdAt: Date | string;
    author: {
      id: string;
      name: string | null;
      username: string | null;
      image: string | null;
    };
  };
}

export function QuoteVibeDialog({
  isOpen,
  onClose,
  targetPost,
}: QuoteVibeDialogProps) {
  const { user } = useSession();
  const [commentary, setCommentary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('public');
  const [communities, setCommunities] = useState<any[]>([]);

  useEffect(() => {
    if (user?.id && isOpen) {
      getUserCommunitiesAction(user.id).then((res) => {
        if (res.success && res.data) {
          setCommunities(res.data);
        }
      });
    }
  }, [user?.id, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentary.trim()) {
      toast.error('Please enter your commentary before quoting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetCommunity = selectedCommunityId === 'public' ? undefined : selectedCommunityId;
      const res = await createQuoteVibeAction(targetPost.id, commentary, targetCommunity);
      if (res?.success) {
        toast.success(targetCommunity ? 'Quote vibe posted to your guild!' : 'Quote vibe posted to your feed!');
        setCommentary('');
        setSelectedCommunityId('public');
        onClose();
      } else {
        toast.error(res?.error || 'Failed to post quote vibe.');
      }
    } catch {
      toast.error('Failed to post quote vibe.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh] overflow-y-auto bg-card/95 border-border/60 backdrop-blur-2xl p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <MessageSquareQuote className="size-4 text-primary" />
            <span>Quote Vibe</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Share this post with your own developer commentary.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2 w-full min-w-0">
          {/* Destination Selector (Public Feed vs Guild) */}
          {communities.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 font-medium">
                <Users className="size-3.5" />
                Post to:
              </span>
              <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
                <SelectTrigger className="h-8 text-xs bg-background/80 border-border/50 rounded-xl flex-1">
                  <SelectValue placeholder="Public Feed" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border/50 text-xs">
                  <SelectItem value="public">🌐 Public Feed</SelectItem>
                  {communities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      🛡️ /c/{c.slug} ({c.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Textarea
            value={commentary}
            onChange={(e) => setCommentary(e.target.value)}
            placeholder="Add your developer thoughts, code review notes, or commentary..."
            rows={4}
            className="w-full max-w-full bg-background/60 border-border/50 rounded-xl resize-none text-sm focus-visible:ring-1 focus-visible:ring-primary/50 break-words"
            disabled={isSubmitting}
            autoFocus
          />

          {/* Embedded Target Post Preview */}
          <div className="pointer-events-none w-full min-w-0 max-w-full overflow-hidden">
            <EmbeddedQuotedPostCard post={targetPost} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="btn-gradient font-medium text-xs px-4 rounded-xl"
              disabled={isSubmitting || !commentary.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  Quoting...
                </>
              ) : (
                'Drop Quote Vibe'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

