'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontalIcon, FlagIcon, BanIcon, Loader2Icon } from 'lucide-react';
import { blockUserAction, createReportAction } from '@/actions/safety.action';
import { toast } from '@/components/ui/toast';
import { useSession } from '@/components/auth/SessionProvider';

interface PostSafetyMenuProps {
  postId: string;
  authorId: string;
  authorUsername: string;
}

export function PostSafetyMenu({ postId, authorId, authorUsername }: PostSafetyMenuProps) {
  const { isAuthenticated } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleReport = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await createReportAction({
        targetType: 'POST',
        targetId: postId,
        reason: reportReason,
        description: reportDescription || undefined,
      });

      if (res.success) {
        toast.success('Thank you. The report has been submitted to moderators.');
        setReportOpen(false);
        setReportDescription('');
      } else {
        toast.error(res.error || 'Failed to submit report');
      }
    } catch {
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlock = async () => {
    if (isBlocking) return;
    try {
      setIsBlocking(true);
      const res = await blockUserAction(authorId);
      if (res.success) {
        toast.success(`@${authorUsername} has been blocked.`);
        window.location.reload();
      } else {
        toast.error(res.error || 'Failed to block user');
      }
    } catch {
      toast.error('Failed to block user');
    } finally {
      setIsBlocking(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 active:bg-primary/20 rounded-lg transition-colors"
      >
        <MoreHorizontalIcon className="size-4" />
      </Button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-9 z-40 w-40 rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setMenuOpen(false);
                setReportOpen(true);
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors text-foreground"
            >
              <FlagIcon className="size-3.5 text-amber-500" />
              <span>Report Vibe</span>
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                handleBlock();
              }}
              disabled={isBlocking}
              className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            >
              <BanIcon className="size-3.5 shrink-0" />
              <span className="truncate">Block</span>
            </button>
          </div>
        </>
      )}

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FlagIcon className="size-4 text-amber-500" />
              Report Content
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-muted-foreground">
              Help us understand what is wrong with this post by @{authorUsername}.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="SPAM">Spam or unwanted self-promotion</option>
                <option value="HARASSMENT">Harassment or abusive behavior</option>
                <option value="MISINFORMATION">Misinformation or fake claims</option>
                <option value="COPYRIGHT">Copyright or intellectual property violation</option>
                <option value="OTHER">Other technical issue</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Details (optional)</label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide additional context for moderators..."
                rows={3}
                className="w-full text-xs rounded-xl border border-border bg-background p-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setReportOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReport}
              disabled={isSubmitting}
              className="btn-gradient text-xs text-white flex items-center gap-1.5"
            >
              {isSubmitting ? <Loader2Icon className="size-3 animate-spin" /> : null}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
