'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlatformPolicyCenter } from '@/components/settings/PlatformPolicyCenter';
import { ShieldCheck } from 'lucide-react';

interface PolicyModalProps {
  children?: React.ReactNode;
}

export function PolicyModal({ children }: PolicyModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <button type="button" className="text-primary hover:underline underline font-medium inline-flex items-center gap-1">
            Platform Policies & Terms
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-white/20">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <DialogTitle className="text-base font-bold">Platform Terms & Developer Policy</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Please review the guidelines governing account usage and developer conduct on VibeGrid.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-2">
          <PlatformPolicyCenter />
        </div>
      </DialogContent>
    </Dialog>
  );
}

