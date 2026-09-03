"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

export function UserAvatar({ src, name, className }: UserAvatarProps) {
  const fallbackSrc = "/avatar.png";

  return (
    <Avatar className={cn("size-10 border-[3px] border-accent shrink-0", className)}>
      <AvatarImage src={src || fallbackSrc} alt={name || "User avatar"} />
      <AvatarFallback className="bg-accent/15 text-accent">
        <User className="size-5 text-accent fill-accent/40" />
      </AvatarFallback>
    </Avatar>
  );
}
