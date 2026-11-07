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
  className = "w-full h-auto object-contain max-h-[650px] mx-auto bg-black/20",
}: PostMediaContainerProps) {
  const { imgOriginSsr, imgOriginCsr } = EnvConfigRepository.getEndpoints();
  const resolvedSsrUrl = urlRelative(mediaUrl, imgOriginSsr, null);
  const resolvedCsrUrl = urlRelative(mediaUrl, imgOriginCsr, null);

  if (!resolvedSsrUrl && !resolvedCsrUrl) return null;

  // Determine if content is video
  const isVideo =
    String(mediaType).toUpperCase() === "VIDEO" ||
    resolvedCsrUrl?.endsWith(".mp4") ||
    resolvedCsrUrl?.endsWith(".webm") ||
    resolvedCsrUrl?.endsWith(".mov") ||
    resolvedCsrUrl?.includes("video/");

  return (
    <div className="w-full bg-muted/30 border-y border-border/50 overflow-hidden">
      {isVideo ? (
        <video
          src={resolvedCsrUrl || undefined}
          controls
          className={`${className} rounded-none`}
        />
      ) : (
        <Image
          src={resolvedCsrUrl || resolvedSsrUrl!}
          alt={alt}
          className={className}
          width={800}
          height={600}
          unoptimized
        />
      )}
    </div>
  );
}
