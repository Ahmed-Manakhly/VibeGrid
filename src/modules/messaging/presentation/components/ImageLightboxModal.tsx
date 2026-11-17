"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DownloadIcon, XIcon, ExternalLinkIcon } from "lucide-react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  imageAlt?: string;
  onClose: () => void;
}

export function ImageLightboxModal({
  isOpen,
  imageUrl,
  imageAlt = "Chat Image Preview",
  onClose,
}: ImageLightboxModalProps) {
  if (!imageUrl) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vibegrid-attachment-${Date.now()}.${blob.type.split("/")[1] || "png"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      window.open(imageUrl, "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-2 bg-background/95 backdrop-blur-2xl border-border/80 shadow-2xl rounded-2xl overflow-hidden flex flex-col items-center">
        <DialogTitle className="sr-only">Image Preview</DialogTitle>
        {/* Lightbox Toolbar */}
        <div className="w-full flex items-center justify-between px-3 py-2 border-b border-border/50">
          <span className="text-xs font-mono text-muted-foreground truncate max-w-sm">
            {imageAlt}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
              title="Download image"
            >
              <DownloadIcon className="size-3.5" />
              <span>Download</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(imageUrl, "_blank")}
              className="h-8 px-2.5 text-xs gap-1.5 rounded-lg"
              title="Open full size in new tab"
            >
              <ExternalLinkIcon className="size-3.5" />
              <span>Full Size</span>
            </Button>
          </div>
        </div>

        {/* Image Content Container */}
        <div className="relative w-full max-h-[75vh] flex items-center justify-center p-2 overflow-hidden">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-h-[70vh] max-w-full w-auto object-contain rounded-xl shadow-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

