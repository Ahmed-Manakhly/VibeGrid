"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon } from "lucide-react";

interface ImageUploadProps {
  onChange: (url: string) => void;
  value: string;
  endpoint: "postImage";
}

function ImageUpload({ endpoint, onChange, value }: ImageUploadProps) {
  if (value) {
    return (
      <div className="relative size-40">
        <img src={value} alt="Upload" className="rounded-md size-40 object-cover" />
        <button
          onClick={() => onChange("")}
          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
          type="button"
        >
          <XIcon className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }
  return (
    <UploadDropzone
      endpoint={endpoint}
      appearance={{
        button: "w-auto px-6 py-2 rounded-xl text-sm font-medium mt-4 cursor-pointer !bg-accent hover:!bg-accent/90 !text-white ut-uploading:!bg-primary ut-uploading:after:!bg-primary/50",
        container: "border border-dashed border-border/50 bg-background/50 rounded-xl p-4 transition-colors hover:border-primary/50 hover:bg-muted/10 cursor-pointer",
        label: "hidden",
        allowedContent: "hidden",
        uploadIcon: "text-primary/70 mb-2 size-8"
      }}
      onClientUploadComplete={(res) => {
        onChange(res?.[0].url);
      }}
      onUploadError={(error: Error) => {
        console.log(error);
      }}
    />
  );
}
export default ImageUpload;