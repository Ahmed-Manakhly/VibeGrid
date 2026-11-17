'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldAlert, Users, MessageSquareOff, UserX } from 'lucide-react';

interface BlockConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  onConfirm: () => void;
  isPending?: boolean;
}

export function BlockConfirmationDialog({
  open,
  onOpenChange,
  username,
  onConfirm,
  isPending = false,
}: BlockConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-6" />
            <AlertDialogTitle className="text-lg font-bold">
              Block @{username}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-foreground/80 leading-relaxed">
            Blocking this developer will initiate a full safety cascade:
          </AlertDialogDescription>

          <div className="space-y-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-foreground/90">
            <div className="flex items-start gap-2.5">
              <Users className="size-4 text-destructive shrink-0 mt-0.5" />
              <span>
                <strong>Automatic Guild Eviction:</strong> You will automatically exit all communities created or owned by @{username}.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <MessageSquareOff className="size-4 text-destructive shrink-0 mt-0.5" />
              <span>
                <strong>Chat Archiving:</strong> Direct conversations will be hidden and direct messaging will be permanently locked.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <UserX className="size-4 text-destructive shrink-0 mt-0.5" />
              <span>
                <strong>Mutual Erasure:</strong> Mutual follows will be severed. Neither of you will see each other's profiles, posts, or comments.
              </span>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 gap-2">
          <AlertDialogCancel disabled={isPending} className="border-border/60">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
          >
            {isPending ? 'Blocking...' : `Block @${username}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

