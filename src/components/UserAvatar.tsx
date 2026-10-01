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

  if (src && (src.startsWith("blob:") || src.startsWith("data:"))) {
    avatarSrc = src;
  } else {
    avatarSrc = urlRelative(src, imgOrigin, "/avatar.png") || "/avatar.png";
  }

  return (
    <Avatar className={cn("size-10 border-[3px] border-accent shrink-0", className)}>
      <AvatarImage src={avatarSrc} alt={name || "User avatar"} />
      <AvatarFallback className="bg-accent/15 text-accent">
        <User className="size-5 text-accent fill-accent/40" />
      </AvatarFallback>
    </Avatar>
  );
}

