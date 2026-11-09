import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("pt-2 sm:pt-3 mb-8 sm:mb-10", className)}>
      {eyebrow && (
        <div className="flex items-center gap-2 mb-3">
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          <p className="eyebrow eyebrow-live uppercase tracking-wider font-mono text-[11px] font-semibold text-primary">
            {eyebrow}
          </p>
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight flex items-center gap-3">
          {Icon && <Icon className="size-6 sm:size-7 text-primary fill-primary/20 shrink-0" />}
          <span>{title}</span>
        </h1>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {subtitle && (
        <p className="text-muted-foreground text-xs sm:text-sm mt-2.5 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
