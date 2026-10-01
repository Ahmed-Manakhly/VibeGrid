"use client";

import * as React from "react";
import { CheckCircle2Icon, AlertCircleIcon, InfoIcon, XIcon, AlertTriangleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  success(message: string, duration = 4000) {
    return toast.show(message, "success", duration);
  },
  error(message: string, duration = 5000) {
    return toast.show(message, "error", duration);
  },
  info(message: string, duration = 4000) {
    return toast.show(message, "info", duration);
  },
  warning(message: string, duration = 4000) {
    return toast.show(message, "warning", duration);
  },
  show(message: string, type: ToastType = "info", duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, type, message, duration };
    toasts = [...toasts, item];
    notify();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
    return id;
  },
  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
  clear() {
    toasts = [];
    notify();
  },
};

export default toast;

export function Toaster() {
  const [activeToasts, setActiveToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const handleUpdate = (updated: ToastItem[]) => {
      setActiveToasts(updated);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  if (activeToasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none"
    >
      {activeToasts.map((t) => {
        const isSuccess = t.type === "success";
        const isError = t.type === "error";
        const isWarning = t.type === "warning";

        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5",
              isSuccess && "bg-emerald-950/90 border-emerald-500/30 text-emerald-100 shadow-emerald-950/40",
              isError && "bg-rose-950/90 border-rose-500/30 text-rose-100 shadow-rose-950/40",
              isWarning && "bg-amber-950/90 border-amber-500/30 text-amber-100 shadow-amber-950/40",
              !isSuccess && !isError && !isWarning && "bg-card/90 border-accent/30 text-foreground shadow-accent/10"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {isSuccess && <CheckCircle2Icon className="size-5 text-emerald-400 shrink-0" />}
              {isError && <AlertCircleIcon className="size-5 text-rose-400 shrink-0" />}
              {isWarning && <AlertTriangleIcon className="size-5 text-amber-400 shrink-0" />}
              {!isSuccess && !isError && !isWarning && <InfoIcon className="size-5 text-accent shrink-0" />}
              <span className="text-sm font-medium leading-snug break-words">{t.message}</span>
            </div>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Dismiss toast"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
