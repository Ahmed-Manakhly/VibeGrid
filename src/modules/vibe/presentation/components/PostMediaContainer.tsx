"use client";

import * as React from "react";
import Image from "next/image";
import urlRelative from "@/lib/utils/urlRelative";
import { EnvConfigRepository } from "@/modules/config/infrastructure/EnvConfigRepository";

interface PostMediaContainerProps {
  mediaUrl: string | null | undefined;
  mediaType?: "IMAGE" | "VIDEO" | string | null;
  alt?: string;
  className?: string;
}

export function PostMediaContainer({
  mediaUrl,
  mediaType,
  alt = "Post media content",
  className = "w-full h-auto object-cover max-h-[600px]",
}: PostMediaContainerProps) {
  const { imgOrigin } = EnvConfigRepository.getEndpoints();
  const resolvedUrl = urlRelative(mediaUrl, imgOrigin, null);

  if (!resolvedUrl) return null;

  // Determine if content is video
  const isVideo =
    String(mediaType).toUpperCase() === "VIDEO" ||
    resolvedUrl.endsWith(".mp4") ||
    resolvedUrl.endsWith(".webm") ||
    resolvedUrl.endsWith(".mov") ||
    resolvedUrl.includes("video/");

  return (
    <div className="w-full bg-muted/30 border-y border-border/50 overflow-hidden">
      {isVideo ? (
        <video
          src={resolvedUrl}
          controls
          className={`${className} rounded-none`}
        />
      ) : (
        <Image
          src={resolvedUrl}
          alt={alt}
          className={className}
          width={800}
          height={600}
        />
      )}
    </div>
  );
}
