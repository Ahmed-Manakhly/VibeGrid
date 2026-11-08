"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import urlRelative from "@/lib/utils/urlRelative";
import { EnvConfigRepository } from "@/modules/config/infrastructure/EnvConfigRepository";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

export function UserAvatar({ src, name, className }: UserAvatarProps) {
  const { imgOrigin } = EnvConfigRepository.getEndpoints();
  let avatarSrc = "/avatar.png";

  if (src && (src.startsWith("blob:") || src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://"))) {
    avatarSrc = src;
  } else if (src) {
    avatarSrc = urlRelative(src, imgOrigin, "/avatar.png") || "/avatar.png";
  }

  // Derive initial letters for clean avatar fallback if image fails or is empty
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : null;

  return (
    <Avatar className={cn("size-10 border-[3px] border-accent shrink-0", className)}>
      <AvatarImage src={avatarSrc} alt={name || "User avatar"} />
      <AvatarFallback className="bg-accent/15 text-accent font-semibold text-xs">
        {initials || <User className="size-4 text-accent fill-accent/40" />}
      </AvatarFallback>
    </Avatar>
  );
}

