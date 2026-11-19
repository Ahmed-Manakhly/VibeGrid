"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlatformPolicyCenter } from "@/components/settings/PlatformPolicyCenter";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { acceptPlatformPolicyAction } from "@/actions/profile.action";
import { toast } from "@/components/ui/toast";
import { useSession } from "@/components/auth/SessionProvider";

export function PolicyPromptModal() {
  const { user, isAuthenticated, refreshSession } = useSession();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleTrigger = () => {
      setOpen(true);
    };
    window.addEventListener("open-policy-prompt", handleTrigger);
    return () => window.removeEventListener("open-policy-prompt", handleTrigger);
  }, []);

  const handleAccept = () => {
    startTransition(async () => {
      const res = await acceptPlatformPolicyAction();
      if (res.success) {
        toast.success("Platform terms & privacy policy accepted! 🎉");
        setOpen(false);
        if (refreshSession) await refreshSession();
        window.dispatchEvent(new CustomEvent("policy-accepted-success"));
      } else {
        toast.error(res.error || "Failed to save policy acceptance");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-xl border-border/80 rounded-2xl shadow-2xl p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2 text-primary">
            <ShieldAlert className="size-5 text-amber-500" />
            <DialogTitle className="text-base font-bold">Policy Acceptance Required</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            To maintain developer safety and platform compliance, all developers (including OAuth and Google/GitHub sign-ins) must accept our platform terms before posting, commenting, or following.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 border rounded-xl p-3 bg-muted/20 max-h-64 overflow-y-auto">
          <PlatformPolicyCenter />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="rounded-xl text-xs h-auto py-2"
          >
            Review Later
          </Button>
          <Button
            type="button"
            onClick={handleAccept}
            disabled={isPending}
            className="btn-gradient text-white rounded-xl text-xs flex items-center justify-center gap-1.5 whitespace-normal h-auto py-2.5 px-4 text-center leading-snug"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin shrink-0" />
                <span>Accepting...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5 shrink-0" />
                <span className="break-words">I Accept Platform Policies & Terms</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

