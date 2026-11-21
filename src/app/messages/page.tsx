import { Suspense } from "react";
import { MessagesPageClient } from "./MessagesPageClient";
import { Loader2Icon } from "lucide-react";
import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Messages",
  description: "Direct messaging between developers on VibeGrid",
  noIndex: true,
});

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2Icon className="animate-spin text-muted-foreground size-8" />
        </div>
      }
    >
      <MessagesPageClient />
    </Suspense>
  );
}
