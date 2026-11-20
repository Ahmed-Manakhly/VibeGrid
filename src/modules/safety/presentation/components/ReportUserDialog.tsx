'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  username: string;
}

const REPORT_REASONS = [
  'Harassment or Hate Speech',
  'Spam or Commercial Solicitation',
  'Impersonation or False Identity',
  'Harmful, Violent or Malicious Content',
  'Other Policy Violation',
];

export function ReportUserDialog({
  open,
  onOpenChange,
  targetUserId,
  username,
}: ReportUserDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    try {
      const reasonText = additionalDetails.trim()
        ? `${selectedReason}: ${additionalDetails.trim()}`
        : selectedReason;

      const { createReportAction } = await import('@/actions/safety.action');
      const res = await createReportAction({
        targetType: 'USER',
        targetId: targetUserId,
        reason: reasonText,
      });

      if (res.success) {
        toast.success(`Report submitted for @${username}. Our moderators will review it.`);
        onOpenChange(false);
        setSelectedReason(REPORT_REASONS[0]);
        setAdditionalDetails('');
      } else {
        toast.error(res.error || 'Failed to submit report');
      }
    } catch {
      toast.error('An error occurred while submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-5" />
            <DialogTitle className="text-base sm:text-lg font-bold">
              Report @{username}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Help keep VibeGrid safe. Select a reason for reporting this developer account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            {REPORT_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                  selectedReason === reason
                    ? 'border-primary/50 bg-primary/10 text-foreground font-medium'
                    : 'border-border/40 hover:bg-muted/30 text-muted-foreground'
                }`}
              >
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-primary"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Additional Details (optional):
            </label>
            <Textarea
              placeholder="Provide any context or links to help moderation..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="min-h-[70px] resize-none text-xs bg-background/60"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="text-xs gap-1.5"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <AlertTriangle className="size-3.5" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

