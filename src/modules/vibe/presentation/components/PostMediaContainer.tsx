"use client";

import * as React from "react";
import Image from "next/image";
import { ZoomInIcon } from "lucide-react";
import urlRelative from "@/lib/utils/urlRelative";
import { EnvConfigRepository } from "@/modules/config/infrastructure/EnvConfigRepository";
import { ImageLightboxModal } from "@/modules/messaging/presentation/components/ImageLightboxModal";

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
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const { imgOriginSsr, imgOriginCsr } = EnvConfigRepository.getEndpoints();
  const resolvedSsrUrl = urlRelative(mediaUrl, imgOriginSsr, null);
  const resolvedCsrUrl = urlRelative(mediaUrl, imgOriginCsr, null);

  if (!resolvedSsrUrl && !resolvedCsrUrl) return null;

  const finalImageUrl = resolvedCsrUrl || resolvedSsrUrl!;

  // Determine if content is video
  const isVideo =
    String(mediaType).toUpperCase() === "VIDEO" ||
    resolvedCsrUrl?.endsWith(".mp4") ||
    resolvedCsrUrl?.endsWith(".webm") ||
    resolvedCsrUrl?.endsWith(".mov") ||
    resolvedCsrUrl?.includes("video/");

  return (
    <>
      <div className="w-full bg-muted/30 border-y border-border/50 overflow-hidden relative group">
        {isVideo ? (
          <video
            src={resolvedCsrUrl || undefined}
            controls
            className={`${className} rounded-none`}
          />
        ) : (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            className="cursor-zoom-in relative block overflow-hidden"
            title="Click to view and download"
          >
            <Image
              src={finalImageUrl}
              alt={alt}
              className={`${className} transition-transform duration-200 group-hover:scale-[1.01]`}
              width={800}
              height={600}
              unoptimized
            />
            <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white rounded-lg px-2 py-1 backdrop-blur-xs shadow-md flex items-center gap-1.5 text-xs font-mono pointer-events-none">
              <ZoomInIcon className="size-3.5" />
              <span>Preview & Download</span>
            </div>
          </div>
        )}
      </div>

      {!isVideo && (
        <ImageLightboxModal
          isOpen={isLightboxOpen}
          imageUrl={finalImageUrl}
          imageAlt={alt}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </>
  );
}
