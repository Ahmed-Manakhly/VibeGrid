'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { Share2Icon, CopyIcon, SendIcon, CheckIcon, Loader2Icon, MessageSquareIcon } from 'lucide-react';
import { getConversationsAction, sendMessageAction } from '@/actions/messaging.action';
import { toast } from '@/components/ui/toast';

interface ShareVibeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postContent?: string | null;
  authorUsername?: string;
}

export function ShareVibeDialog({
  isOpen,
  onClose,
  postId,
  postContent,
  authorUsername,
}: ShareVibeDialogProps) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingToId, setSendingToId] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [hasCopied, setHasCopied] = useState(false);

  const vibeUrl = typeof window !== 'undefined' ? `${window.location.origin}/explore/${postId}` : `/explore/${postId}`;

  useEffect(() => {
    if (isOpen) {
      const loadConversations = async () => {
        setIsLoading(true);
        try {
          const res = await getConversationsAction();
          if (res?.success && Array.isArray(res.conversations)) {
            setConversations(res.conversations);
          }
        } catch {
          // Fallback
        } finally {
          setIsLoading(false);
        }
      };
      loadConversations();
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(vibeUrl);
      setHasCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `Vibe by @${authorUsername || 'developer'} on VibeGrid`,
          text: postContent ? postContent.substring(0, 100) : 'Check out this vibe on VibeGrid',
          url: vibeUrl,
        });
        toast.success('Shared successfully!');
        onClose();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleSendDM = async (conversationId: string) => {
    if (sendingToId) return;
    try {
      setSendingToId(conversationId);
      const messageText = `Check out this vibe by @${authorUsername || 'developer'}: ${vibeUrl}`;
      const res = await sendMessageAction(conversationId, messageText);
      if (res?.success) {
        setSentMap((prev) => ({ ...prev, [conversationId]: true }));
        toast.success('Vibe sent in conversation!');
      } else {
        toast.error('Failed to send message');
      }
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSendingToId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Share2Icon className="size-4 text-primary" />
            <span>Share Vibe</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Top Quick Actions: Copy Link & Native Share */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/70 transition-colors text-xs font-medium text-foreground"
            >
              {hasCopied ? (
                <>
                  <CheckIcon className="size-4 text-emerald-400" />
                  <span>Link Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon className="size-4 text-muted-foreground" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/70 transition-colors text-xs font-medium text-foreground px-4"
              >
                <Share2Icon className="size-4 text-muted-foreground" />
                <span>More</span>
              </button>
            )}
          </div>

          {/* Send in Direct Message List */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
              Send in Direct Message
            </p>

            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                <MessageSquareIcon className="size-6 mx-auto mb-1 opacity-40" />
                <p>No active conversations yet.</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {conversations.map((c) => {
                  const otherUser = c.otherParticipant;
                  const isSent = Boolean(sentMap[c.id]);
                  const isSendingThis = sendingToId === c.id;

                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar
                          src={otherUser?.image}
                          name={otherUser?.name || otherUser?.username}
                          className="size-8 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {otherUser?.name || otherUser?.username}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate font-mono">
                            @{otherUser?.username}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isSent ? 'secondary' : 'default'}
                        onClick={() => handleSendDM(c.id)}
                        disabled={isSent || isSendingThis}
                        className={`h-7 px-3 text-xs ${isSent ? 'text-emerald-400 font-semibold' : 'btn-gradient text-white'}`}
                      >
                        {isSendingThis ? (
                          <Loader2Icon className="size-3 animate-spin" />
                        ) : isSent ? (
                          <span className="flex items-center gap-1">
                            <CheckIcon className="size-3 text-emerald-400" />
                            Sent
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <SendIcon className="size-3" />
                            Send
                          </span>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
