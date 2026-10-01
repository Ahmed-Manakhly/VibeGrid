"use client";

import { useState } from "react";
import { XIcon, UploadCloudIcon, Loader2Icon, FilmIcon, ImageIcon } from "lucide-react";
import { uploadMediaAsset, isVideoUrl } from "@/lib/mediaClient";
import { toast } from "@/components/ui/toast";

interface ImageUploadProps {
  onChange: (url: string) => void;
  value: string;
  endpoint?: string;
  purpose?: 'avatar' | 'post_attachment';
}

function ImageUpload({ onChange, value, purpose = 'post_attachment' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await uploadMediaAsset({ file, purpose });
      onChange(result.publicUrl);
      toast.success("Media uploaded successfully!");
    } catch (err: any) {
      console.error("[MediaUpload error]", err);
      toast.error(err.message || "Failed to upload media asset");
    } finally {
      setIsUploading(false);
    }
  };

  if (value) {
    const isVid = isVideoUrl(value);
    return (
      <div className="relative max-w-md w-full overflow-hidden rounded-xl border border-border/50 bg-background/50">
        {isVid ? (
          <video src={value} controls className="w-full max-h-80 object-contain rounded-xl bg-black/40" />
        ) : (
          <img src={value} alt="Media Upload" className="w-full max-h-80 object-contain rounded-xl bg-black/40" />
        )}
        <button
          onClick={() => onChange("")}
          className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 transition-colors rounded-full shadow-md text-white"
          type="button"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <label className="border border-dashed border-border/50 bg-background/50 rounded-xl p-6 flex flex-col items-center justify-center transition-colors hover:border-accent/50 hover:bg-muted/10 cursor-pointer text-center group">
      <input
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      {isUploading ? (
        <div className="flex flex-col items-center py-2">
          <Loader2Icon className="size-8 text-accent animate-spin mb-2" />
          <span className="text-sm font-medium text-muted-foreground">Uploading media...</span>
        </div>
      ) : (
        <div className="flex flex-col items-center py-2">
          <div className="flex items-center gap-2 mb-2 text-accent/70 group-hover:text-accent transition-colors">
            <ImageIcon className="size-6" />
            <FilmIcon className="size-6" />
          </div>
          <span className="text-sm font-semibold text-foreground">Click to upload photo or video</span>
          <span className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, WEBP, MP4, WEBM (Max 100MB)</span>
        </div>
      )}
    </label>
  );
}

export default ImageUpload;